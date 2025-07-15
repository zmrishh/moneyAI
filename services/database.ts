import * as SQLite from 'expo-sqlite';
import { Transaction, Category, Budget, Goal } from '@/types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (this.db) return;
    
    this.db = await SQLite.openDatabaseAsync('moneyai.db');
    await this.createTables();
    await this.insertDefaultCategories();
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        location TEXT,
        tags TEXT,
        receipt_image TEXT
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        budget REAL,
        parent_id TEXT
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        target_date TEXT,
        category_id TEXT,
        type TEXT DEFAULT 'savings',
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'other',
        auto_save_amount REAL,
        auto_save_frequency TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        percentage INTEGER NOT NULL,
        amount REAL NOT NULL,
        achieved INTEGER DEFAULT 0,
        achieved_date TEXT,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
      );
    `);
  }

  private async insertDefaultCategories() {
    if (!this.db) return;

    const defaultCategories = [
      { id: '1', name: 'Food & Dining', icon: 'fork.knife', color: '#FF6B6B' },
      { id: '2', name: 'Transportation', icon: 'car.fill', color: '#4ECDC4' },
      { id: '3', name: 'Shopping', icon: 'bag.fill', color: '#45B7D1' },
      { id: '4', name: 'Entertainment', icon: 'tv.fill', color: '#96CEB4' },
      { id: '5', name: 'Bills & Utilities', icon: 'bolt.fill', color: '#FFEAA7' },
      { id: '6', name: 'Healthcare', icon: 'cross.fill', color: '#DDA0DD' },
      { id: '7', name: 'Income', icon: 'dollarsign.circle.fill', color: '#98D8C8' },
    ];

    for (const category of defaultCategories) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)',
        [category.id, category.name, category.icon, category.color]
      );
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    await this.db.runAsync(
      'INSERT INTO transactions (id, amount, description, category, date, type, source, location, tags, receipt_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        transaction.amount,
        transaction.description,
        transaction.category,
        transaction.date.toISOString(),
        transaction.type,
        transaction.source,
        transaction.location || null,
        transaction.tags ? JSON.stringify(transaction.tags) : null,
        transaction.receipt_image || null,
      ]
    );

    return id;
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM transactions ORDER BY date DESC LIMIT ?',
      [limit]
    );

    return result.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      description: row.description,
      category: row.category,
      date: new Date(row.date),
      type: row.type,
      source: row.source,
      location: row.location,
      tags: row.tags ? JSON.parse(row.tags) : [],
      receipt_image: row.receipt_image,
    }));
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync('SELECT * FROM categories');

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      budget: row.budget,
      parent_id: row.parent_id,
    }));
  }

  async getTotalBalance(): Promise<{ income: number; expenses: number; balance: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const incomeResult = await this.db.getFirstAsync(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "income"'
    ) as any;

    const expenseResult = await this.db.getFirstAsync(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "expense"'
    ) as any;

    const income = incomeResult?.total || 0;
    const expenses = expenseResult?.total || 0;

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }

  // Savings Goals Methods
  async addSavingsGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO goals (
        id, title, description, target_amount, current_amount, target_date, 
        category_id, type, priority, category, auto_save_amount, auto_save_frequency, 
        is_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        goal.title,
        goal.description || null,
        goal.target_amount,
        goal.current_amount || 0,
        goal.target_date?.toISOString() || null,
        goal.category_id || null,
        'savings',
        (goal as any).priority || 'medium',
        (goal as any).category || 'other',
        (goal as any).auto_save_amount || null,
        (goal as any).auto_save_frequency || null,
        goal.is_completed ? 1 : 0,
        now,
        now
      ]
    );

    // Add milestones if provided
    if ((goal as any).milestones && Array.isArray((goal as any).milestones)) {
      for (const milestone of (goal as any).milestones) {
        await this.db.runAsync(
          'INSERT INTO milestones (id, goal_id, percentage, amount, achieved, achieved_date) VALUES (?, ?, ?, ?, ?, ?)',
          [
            `${id}_${milestone.percentage}`,
            id,
            milestone.percentage,
            milestone.amount,
            milestone.achieved ? 1 : 0,
            milestone.achieved_date?.toISOString() || null
          ]
        );
      }
    }

    return id;
  }

  async getSavingsGoals(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.db.getAllAsync(
      'SELECT * FROM goals WHERE type = "savings" ORDER BY created_at DESC'
    );

    const goalsWithMilestones = await Promise.all(
      goals.map(async (goal: any) => {
        const milestones = await this.db!.getAllAsync(
          'SELECT * FROM milestones WHERE goal_id = ? ORDER BY percentage ASC',
          [goal.id]
        );

        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          target_date: goal.target_date ? new Date(goal.target_date) : undefined,
          category_id: goal.category_id,
          type: goal.type,
          priority: goal.priority,
          category: goal.category,
          auto_save_amount: goal.auto_save_amount,
          auto_save_frequency: goal.auto_save_frequency,
          is_completed: Boolean(goal.is_completed),
          created_at: new Date(goal.created_at),
          updated_at: new Date(goal.updated_at),
          milestones: milestones.map((m: any) => ({
            id: m.id,
            percentage: m.percentage,
            amount: m.amount,
            achieved: Boolean(m.achieved),
            achieved_date: m.achieved_date ? new Date(m.achieved_date) : undefined,
          }))
        };
      })
    );

    return goalsWithMilestones;
  }

  async updateSavingsGoalAmount(goalId: string, additionalAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get current goal
    const goal = await this.db.getFirstAsync(
      'SELECT * FROM goals WHERE id = ?',
      [goalId]
    ) as any;

    if (!goal) throw new Error('Goal not found');

    const newAmount = goal.current_amount + additionalAmount;
    const now = new Date().toISOString();

    // Update goal amount
    await this.db.runAsync(
      'UPDATE goals SET current_amount = ?, updated_at = ?, is_completed = ? WHERE id = ?',
      [newAmount, now, newAmount >= goal.target_amount ? 1 : 0, goalId]
    );

    // Check and update milestones
    const milestones = await this.db.getAllAsync(
      'SELECT * FROM milestones WHERE goal_id = ? AND achieved = 0 ORDER BY percentage ASC',
      [goalId]
    );

    for (const milestone of milestones as any[]) {
      if (newAmount >= milestone.amount) {
        await this.db.runAsync(
          'UPDATE milestones SET achieved = 1, achieved_date = ? WHERE id = ?',
          [now, milestone.id]
        );
      }
    }

    // Add transaction record for the savings contribution
    await this.addTransaction({
      amount: additionalAmount,
      description: `Savings: ${goal.title}`,
      category: 'Savings',
      type: 'expense',
      source: 'manual',
      date: new Date(),
      tags: ['savings', 'goal']
    });
  }

  async deleteSavingsGoal(goalId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete milestones first (foreign key constraint)
    await this.db.runAsync('DELETE FROM milestones WHERE goal_id = ?', [goalId]);
    
    // Delete goal
    await this.db.runAsync('DELETE FROM goals WHERE id = ?', [goalId]);
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
  }

  async getTransactionsByCategory(category: string, limit: number = 50): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM transactions WHERE category = ? ORDER BY date DESC LIMIT ?',
      [category, limit]
    );

    return result.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      description: row.description,
      category: row.category,
      date: new Date(row.date),
      type: row.type,
      source: row.source,
      location: row.location,
      tags: row.tags ? JSON.parse(row.tags) : [],
      receipt_image: row.receipt_image,
    }));
  }

  async getMonthlySpending(): Promise<{ [month: string]: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM transactions 
      WHERE type = 'expense' 
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 12`
    );

    const monthlyData: { [month: string]: number } = {};
    result.forEach((row: any) => {
      monthlyData[row.month] = row.total;
    });

    return monthlyData;
  }
}

export const dbService = new DatabaseService();