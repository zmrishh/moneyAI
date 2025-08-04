import { Transaction } from '@/types';

export interface ParsedTransaction {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  confidence: number;
}

class NLPService {
  private categoryKeywords = {
    'Food & Dining': [
      'food', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast',
      'pizza', 'burger', 'meal', 'eat', 'drink', 'dining', 'kitchen', 'cook',
      'grocery', 'supermarket', 'vegetables', 'fruits', 'snack', 'tea'
    ],
    'Transportation': [
      'uber', 'taxi', 'bus', 'train', 'metro', 'fuel', 'petrol', 'gas',
      'parking', 'toll', 'ride', 'car', 'bike', 'auto', 'flight', 'travel'
    ],
    'Shopping': [
      'shop', 'buy', 'purchase', 'store', 'mall', 'amazon', 'flipkart',
      'clothes', 'shoes', 'bag', 'shopping', 'order', 'delivery', 'online'
    ],
    'Entertainment': [
      'movie', 'cinema', 'theater', 'game', 'sport', 'concert', 'music',
      'netflix', 'subscription', 'party', 'fun', 'entertainment', 'book'
    ],
    'Bills & Utilities': [
      'bill', 'electricity', 'water', 'internet', 'phone', 'rent', 'maintenance',
      'utility', 'recharge', 'mobile', 'broadband', 'insurance', 'loan'
    ],
    'Healthcare': [
      'doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health',
      'clinic', 'checkup', 'treatment', 'dental', 'vitamins', 'healthcare'
    ],
    'Income': [
      'salary', 'income', 'earn', 'paid', 'bonus', 'freelance', 'work',
      'job', 'received', 'refund', 'cashback', 'reward', 'profit'
    ]
  };

  private incomeKeywords = [
    'received', 'earned', 'salary', 'income', 'paid', 'bonus', 'refund',
    'cashback', 'reward', 'profit', 'freelance', 'commission', 'dividend'
  ];

  private expenseKeywords = [
    'spent', 'bought', 'purchased', 'paid for', 'cost', 'expense', 'bill'
  ];

  parseTransaction(input: string): ParsedTransaction {
    const normalizedInput = input.toLowerCase().trim();
    
    // Extract amount
    const amount = this.extractAmount(normalizedInput);
    
    // Determine transaction type
    const type = this.determineTransactionType(normalizedInput);
    
    // Extract description
    const description = this.extractDescription(input, amount);
    
    // Categorize transaction
    const category = this.categorizeTransaction(normalizedInput);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(normalizedInput, amount, category);

    return {
      amount,
      description,
      category,
      type,
      confidence
    };
  }

  private extractAmount(input: string): number {
    // Look for patterns like "300 rupees", "₹500", "$50", "300", "rs 400"
    const patterns = [
      /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /rupees?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|₹)/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)/g // fallback for any number
    ];

    for (const pattern of patterns) {
      const matches = input.match(pattern);
      if (matches) {
        const match = matches[0];
        const numberMatch = match.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (numberMatch) {
          return parseFloat(numberMatch[1].replace(/,/g, ''));
        }
      }
    }

    return 0;
  }

  private determineTransactionType(input: string): 'income' | 'expense' {
    const incomeScore = this.incomeKeywords.reduce((score, keyword) => {
      return input.includes(keyword) ? score + 1 : score;
    }, 0);

    const expenseScore = this.expenseKeywords.reduce((score, keyword) => {
      return input.includes(keyword) ? score + 1 : score;
    }, 0);

    return incomeScore > expenseScore ? 'income' : 'expense';
  }

  private extractDescription(input: string, amount: number): string {
    // Remove amount-related text and clean up
    let description = input
      .replace(/₹\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi, '')
      .replace(/rs\.?\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi, '')
      .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:rupees?|rs\.?)/gi, '')
      .replace(/\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi, '')
      .replace(/\b\d+(?:,\d{3})*(?:\.\d{2})?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);

    return description || 'Transaction';
  }

  private categorizeTransaction(input: string): string {
    let bestCategory = 'Shopping'; // default
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const score = keywords.reduce((total, keyword) => {
        return input.includes(keyword) ? total + 1 : total;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  private calculateConfidence(input: string, amount: number, category: string): number {
    let confidence = 0.5; // base confidence

    // Boost confidence if amount is found
    if (amount > 0) confidence += 0.3;

    // Boost confidence if category keywords are found
    const categoryKeywords = this.categoryKeywords[category] || [];
    const keywordMatches = categoryKeywords.filter(keyword => 
      input.includes(keyword)
    ).length;
    
    if (keywordMatches > 0) {
      confidence += Math.min(keywordMatches * 0.1, 0.3);
    }

    // Boost confidence if transaction type keywords are found
    const hasTypeKeywords = [...this.incomeKeywords, ...this.expenseKeywords]
      .some(keyword => input.includes(keyword));
    
    if (hasTypeKeywords) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  // Quick suggestions based on common patterns
  getSuggestions(): string[] {
    return [
      "Bought coffee for ₹150",
      "Paid electricity bill ₹2,500",
      "Grocery shopping ₹800",
      "Uber ride to office ₹120",
      "Movie tickets ₹400",
      "Received salary ₹50,000",
      "Lunch at restaurant ₹350",
      "Petrol fill-up ₹2,000"
    ];
  }
}

export const nlpService = new NLPService();