from api import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    full_name = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    country_code = db.Column(db.String(5), default='IN')
    currency = db.Column(db.String(3), default='INR')
    timezone = db.Column(db.String(50), default='Asia/Kolkata')
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade='all, delete-orphan')
    goals = db.relationship('Goal', backref='user', lazy=True, cascade='all, delete-orphan')
    bills = db.relationship('Bill', backref='user', lazy=True, cascade='all, delete-orphan')
    debts = db.relationship('Debt', backref='user', lazy=True, cascade='all, delete-orphan')
    subscriptions = db.relationship('Subscription', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), nullable=False)  # Hex color
    parent_id = db.Column(db.String(36), db.ForeignKey('categories.id'))
    is_system = db.Column(db.Boolean, default=False)  # System vs user-created
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Self-referential relationship for subcategories
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]))

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'))
    category_name = db.Column(db.String(100), nullable=False)  # Denormalized for faster queries
    transaction_type = db.Column(db.Enum('income', 'expense', name='transaction_type'), nullable=False)
    source = db.Column(db.Enum('manual', 'sms', 'receipt', 'auto', 'import', name='transaction_source'), default='manual')
    date = db.Column(db.DateTime, nullable=False, index=True)
    location = db.Column(db.String(255))
    merchant = db.Column(db.String(255))
    notes = db.Column(db.Text)
    tags = db.Column(db.JSON)  # Array of tags
    receipt_url = db.Column(db.String(255))
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_id = db.Column(db.String(36))  # Links to recurring transaction template
    aa_transaction_id = db.Column(db.String(255))  # Account Aggregator reference
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('Category', backref='transactions')

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'))
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(12, 2), default=0)
    period = db.Column(db.Enum('weekly', 'monthly', 'quarterly', 'yearly', name='budget_period'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    alert_threshold = db.Column(db.Integer, default=80)  # Alert at 80% of budget
    color = db.Column(db.String(7))  # Hex color
    icon = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('Category', backref='budgets')

class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    current_amount = db.Column(db.Numeric(12, 2), default=0)
    target_date = db.Column(db.Date)
    goal_type = db.Column(db.Enum('savings', 'debt_payoff', 'investment', 'emergency_fund', name='goal_type'), default='savings')
    priority = db.Column(db.Enum('low', 'medium', 'high', name='goal_priority'), default='medium')
    category = db.Column(db.String(100))
    auto_save_amount = db.Column(db.Numeric(12, 2))
    auto_save_frequency = db.Column(db.Enum('daily', 'weekly', 'monthly', name='auto_save_frequency'))
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    milestones = db.relationship('Milestone', backref='goal', lazy=True, cascade='all, delete-orphan')

class Milestone(db.Model):
    __tablename__ = 'milestones'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id = db.Column(db.String(36), db.ForeignKey('goals.id'), nullable=False)
    percentage = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    achieved = db.Column(db.Boolean, default=False)
    achieved_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.Enum('monthly', 'quarterly', 'yearly', name='recurrence_pattern'))
    is_paid = db.Column(db.Boolean, default=False)
    payment_date = db.Column(db.DateTime)
    late_fee = db.Column(db.Numeric(12, 2))
    auto_pay = db.Column(db.Boolean, default=False)
    reminder_days = db.Column(db.Integer, default=3)  # Days before due date to remind
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Debt(db.Model):
    __tablename__ = 'debts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    debt_type = db.Column(db.Enum('owe', 'owed', name='debt_type'), nullable=False)
    person_name = db.Column(db.String(200), nullable=False)
    person_contact = db.Column(db.String(100))
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    original_amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.Date)
    created_date = db.Column(db.Date, nullable=False)
    is_settled = db.Column(db.Boolean, default=False)
    settled_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payments = db.relationship('DebtPayment', backref='debt', lazy=True, cascade='all, delete-orphan')

class DebtPayment(db.Model):
    __tablename__ = 'debt_payments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    debt_id = db.Column(db.String(36), db.ForeignKey('debts.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    billing_cycle = db.Column(db.Enum('weekly', 'monthly', 'quarterly', 'yearly', name='billing_cycle'), nullable=False)
    next_billing_date = db.Column(db.Date, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    auto_renew = db.Column(db.Boolean, default=True)
    reminder_days = db.Column(db.Integer, default=3)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    price_changes = db.relationship('PriceChange', backref='subscription', lazy=True, cascade='all, delete-orphan')

class PriceChange(db.Model):
    __tablename__ = 'price_changes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = db.Column(db.String(36), db.ForeignKey('subscriptions.id'), nullable=False)
    old_amount = db.Column(db.Numeric(12, 2), nullable=False)
    new_amount = db.Column(db.Numeric(12, 2), nullable=False)
    change_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AccountAggregatorConnection(db.Model):
    __tablename__ = 'aa_connections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    fip_id = db.Column(db.String(100), nullable=False)
    fip_name = db.Column(db.String(200), nullable=False)
    account_reference = db.Column(db.String(255), nullable=False)
    masked_account_number = db.Column(db.String(50))
    account_type = db.Column(db.String(50))
    fi_type = db.Column(db.String(50))
    consent_id = db.Column(db.String(255))
    consent_status = db.Column(db.Enum('ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED', name='consent_status'), default='ACTIVE')
    last_sync = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIInteraction(db.Model):
    __tablename__ = 'ai_interactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    session_id = db.Column(db.String(36), nullable=False, index=True)
    user_message = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(100))  # transaction, balance, analysis, etc.
    confidence = db.Column(db.Float)
    action_taken = db.Column(db.String(100))  # created_transaction, provided_balance, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)