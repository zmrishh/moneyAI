from flask import Blueprint, request, jsonify
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, timedelta
import uuid
import re
import json

ai_bp = Blueprint('ai', __name__)

class NLPService:
    """Natural Language Processing service for parsing transactions and queries"""
    
    def __init__(self):
        self.category_keywords = {
            'Food & Dining': [
                'food', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast',
                'pizza', 'burger', 'meal', 'eat', 'drink', 'dining', 'kitchen', 'cook',
                'grocery', 'supermarket', 'vegetables', 'fruits', 'snack', 'tea', 'swiggy', 'zomato'
            ],
            'Transportation': [
                'uber', 'taxi', 'bus', 'train', 'metro', 'fuel', 'petrol', 'gas',
                'parking', 'toll', 'ride', 'car', 'bike', 'auto', 'flight', 'travel', 'ola'
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
        }
        
        self.income_keywords = [
            'received', 'earned', 'salary', 'income', 'paid', 'bonus', 'refund',
            'cashback', 'reward', 'profit', 'freelance', 'commission', 'dividend', 'got'
        ]
        
        self.expense_keywords = [
            'spent', 'bought', 'purchased', 'paid for', 'cost', 'expense', 'bill', 'gave'
        ]
    
    def parse_transaction(self, text):
        """Parse natural language text into transaction data"""
        text_lower = text.lower().strip()
        
        # Extract amount
        amount = self._extract_amount(text_lower)
        
        # Determine transaction type
        transaction_type = self._determine_transaction_type(text_lower)
        
        # Extract description
        description = self._extract_description(text, amount)
        
        # Determine category
        category = self._categorize_transaction(text_lower)
        
        # Calculate confidence
        confidence = self._calculate_confidence(text_lower, amount, category)
        
        return {
            'amount': amount,
            'description': description,
            'category_name': category,
            'transaction_type': transaction_type,
            'confidence': confidence,
            'date': datetime.now().isoformat(),
            'source': 'ai_parsed'
        }
    
    def _extract_amount(self, text):
        """Extract monetary amount from text"""
        patterns = [
            r'₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # ₹500, ₹1,000.50
            r'rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # rs 500, rs. 1000
            r'rupees?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # 500 rupees
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|₹)',  # 500 ₹
            r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $50
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)'  # Plain number (fallback)
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Return the first match, removing commas
                return float(matches[0].replace(',', ''))
        
        return 0
    
    def _determine_transaction_type(self, text):
        """Determine if transaction is income or expense"""
        income_score = sum(1 for keyword in self.income_keywords if keyword in text)
        expense_score = sum(1 for keyword in self.expense_keywords if keyword in text)
        
        return 'income' if income_score > expense_score else 'expense'
    
    def _extract_description(self, text, amount):
        """Extract clean description from text"""
        # Remove amount-related patterns
        clean_text = re.sub(r'₹\s*\d+(?:,\d{3})*(?:\.\d{2})?', '', text, flags=re.IGNORECASE)
        clean_text = re.sub(r'rs\.?\s*\d+(?:,\d{3})*(?:\.\d{2})?', '', clean_text, flags=re.IGNORECASE)
        clean_text = re.sub(r'\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:rupees?|rs\.?)', '', clean_text, flags=re.IGNORECASE)
        clean_text = re.sub(r'\$\s*\d+(?:,\d{3})*(?:\.\d{2})?', '', clean_text, flags=re.IGNORECASE)
        clean_text = re.sub(r'\b\d+(?:,\d{3})*(?:\.\d{2})?\b', '', clean_text)
        
        # Clean up and capitalize
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Remove common action words at the beginning
        action_words = ['bought', 'paid', 'spent', 'received', 'earned', 'got', 'gave']
        for word in action_words:
            if clean_text.lower().startswith(word):
                clean_text = clean_text[len(word):].strip()
                break
        
        # Capitalize first letter
        if clean_text:
            clean_text = clean_text[0].upper() + clean_text[1:]
        
        return clean_text or 'Transaction'
    
    def _categorize_transaction(self, text):
        """Categorize transaction based on keywords"""
        best_category = 'Shopping'  # Default
        max_score = 0
        
        for category, keywords in self.category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > max_score:
                max_score = score
                best_category = category
        
        return best_category
    
    def _calculate_confidence(self, text, amount, category):
        """Calculate confidence score for the parsing"""
        confidence = 0.5  # Base confidence
        
        # Boost if amount found
        if amount > 0:
            confidence += 0.3
        
        # Boost if category keywords match
        category_keywords = self.category_keywords.get(category, [])
        keyword_matches = sum(1 for keyword in category_keywords if keyword in text)
        if keyword_matches > 0:
            confidence += min(keyword_matches * 0.1, 0.3)
        
        # Boost if transaction type keywords found
        type_keywords = self.income_keywords + self.expense_keywords
        if any(keyword in text for keyword in type_keywords):
            confidence += 0.2
        
        return min(confidence, 1.0)

# Initialize NLP service
nlp_service = NLPService()

@ai_bp.route('/chat', methods=['POST'])
@require_auth
def chat():
    """
    Process AI chat messages and respond accordingly
    Request body: {"message": "user message", "session_id": "optional session id"}
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not data or 'message' not in data:
            return error_response("Message is required", 400)
        
        user_message = data['message'].strip()
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Determine intent and process message
        intent, response_data = process_ai_message(user_message, user)
        
        # Store interaction
        interaction_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'session_id': session_id,
            'user_message': user_message,
            'ai_response': response_data['message'],
            'intent': intent,
            'confidence': response_data.get('confidence', 0.8),
            'action_taken': response_data.get('action_taken'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('ai_interactions').insert(interaction_data).execute()
        
        return success_response({
            'message': response_data['message'],
            'intent': intent,
            'session_id': session_id,
            'action_taken': response_data.get('action_taken'),
            'data': response_data.get('data'),
            'suggestions': response_data.get('suggestions', [])
        }, "Message processed successfully")
        
    except Exception as e:
        return error_response(f"Failed to process message: {str(e)}", 500)

@ai_bp.route('/parse-transaction', methods=['POST'])
@require_auth
def parse_transaction():
    """
    Parse natural language text into transaction data
    Request body: {"text": "bought coffee for 150 rupees"}
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return error_response("Text is required", 400)
        
        text = data['text'].strip()
        if not text:
            return error_response("Text cannot be empty", 400)
        
        # Parse transaction
        parsed_transaction = nlp_service.parse_transaction(text)
        
        return success_response(parsed_transaction, "Transaction parsed successfully")
        
    except Exception as e:
        return error_response(f"Failed to parse transaction: {str(e)}", 500)

@ai_bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    """Get AI suggestions for common queries and transactions"""
    suggestions = [
        "What's my balance?",
        "Show my spending this month",
        "Add coffee ₹150",
        "Paid electricity bill ₹2,500",
        "Received salary ₹50,000",
        "How much did I spend on food?",
        "Create a budget for shopping",
        "Show my upcoming bills"
    ]
    
    return success_response({
        'transaction_examples': [
            "Bought coffee for ₹150",
            "Paid electricity bill ₹2,500",
            "Grocery shopping ₹800",
            "Uber ride to office ₹120",
            "Movie tickets ₹400",
            "Received salary ₹50,000",
            "Lunch at restaurant ₹350",
            "Petrol fill-up ₹2,000"
        ],
        'query_examples': suggestions
    }, "Suggestions retrieved successfully")

def process_ai_message(message, user):
    """Process AI message and determine appropriate response"""
    message_lower = message.lower().strip()
    
    # Transaction creation intent
    if any(keyword in message_lower for keyword in ['add', 'spent', 'bought', 'paid', 'received', 'earned']):
        return handle_transaction_intent(message, user)
    
    # Balance inquiry intent
    if any(keyword in message_lower for keyword in ['balance', 'total', 'how much', 'money']):
        return handle_balance_intent(message, user)
    
    # Spending analysis intent
    if any(keyword in message_lower for keyword in ['spending', 'expenses', 'spent on', 'analysis']):
        return handle_spending_intent(message, user)
    
    # Budget intent
    if any(keyword in message_lower for keyword in ['budget', 'limit', 'allowance']):
        return handle_budget_intent(message, user)
    
    # Bills intent
    if any(keyword in message_lower for keyword in ['bills', 'due', 'payment']):
        return handle_bills_intent(message, user)
    
    # Default response
    return 'general', {
        'message': "I can help you manage your finances! Try asking about your balance, expenses, or say something like 'Add coffee ₹150' to record a transaction.",
        'suggestions': [
            "What's my balance?",
            "Show my spending this month",
            "Add coffee ₹150",
            "Show my budgets"
        ]
    }

def handle_transaction_intent(message, user):
    """Handle transaction creation from natural language"""
    try:
        # Parse transaction
        parsed = nlp_service.parse_transaction(message)
        
        if parsed['amount'] <= 0:
            return 'transaction_error', {
                'message': "I couldn't find a valid amount in your message. Could you try again with a clear amount? For example: 'Add coffee ₹150'",
                'suggestions': ["Add coffee ₹150", "Paid bill ₹500", "Received salary ₹25000"]
            }
        
        # Create transaction
        transaction_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'amount': parsed['amount'],
            'description': parsed['description'],
            'category_name': parsed['category_name'],
            'transaction_type': parsed['transaction_type'],
            'date': parsed['date'],
            'source': 'ai_parsed',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('transactions').insert(transaction_data).execute()
        
        if result.data:
            return 'transaction_created', {
                'message': f"✅ Added {parsed['transaction_type']} of ₹{parsed['amount']:.2f} for {parsed['description']} in {parsed['category_name']} category.",
                'action_taken': 'created_transaction',
                'data': result.data[0],
                'confidence': parsed['confidence']
            }
        else:
            return 'transaction_error', {
                'message': "I understood your transaction but couldn't save it. Please try again.",
                'data': parsed
            }
            
    except Exception as e:
        return 'transaction_error', {
            'message': f"Sorry, I couldn't process that transaction. {str(e)}",
            'suggestions': ["Try: 'Add coffee ₹150'", "Try: 'Paid electricity bill ₹2500'"]
        }

def handle_balance_intent(message, user):
    """Handle balance and summary inquiries"""
    try:
        # Get recent transactions for balance calculation
        end_date = datetime.now()
        start_date = end_date.replace(day=1)  # Current month
        
        query = supabase_client.table('transactions').select('amount,transaction_type').eq('user_id', user['id'])
        query = query.gte('date', start_date.isoformat()).lte('date', end_date.isoformat())
        
        result = query.execute()
        
        total_income = sum(float(t['amount']) for t in result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in result.data if t['transaction_type'] == 'expense')
        balance = total_income - total_expense
        
        return 'balance_inquiry', {
            'message': f"💰 This month: Income ₹{total_income:.2f}, Expenses ₹{total_expense:.2f}, Balance ₹{balance:.2f}",
            'action_taken': 'provided_balance',
            'data': {
                'total_income': total_income,
                'total_expense': total_expense,
                'balance': balance,
                'period': 'current_month'
            },
            'suggestions': [
                "Show my spending by category",
                "What did I spend on food?",
                "Show last week's expenses"
            ]
        }
        
    except Exception as e:
        return 'balance_error', {
            'message': "Sorry, I couldn't retrieve your balance information right now."
        }

def handle_spending_intent(message, user):
    """Handle spending analysis requests"""
    try:
        # Simple spending analysis for current month
        end_date = datetime.now()
        start_date = end_date.replace(day=1)
        
        query = supabase_client.table('transactions').select('amount,category_name').eq('user_id', user['id']).eq('transaction_type', 'expense')
        query = query.gte('date', start_date.isoformat()).lte('date', end_date.isoformat())
        
        result = query.execute()
        
        # Group by category
        category_spending = {}
        total_spending = 0
        
        for transaction in result.data:
            category = transaction['category_name']
            amount = float(transaction['amount'])
            category_spending[category] = category_spending.get(category, 0) + amount
            total_spending += amount
        
        # Sort by amount
        sorted_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)
        
        if not sorted_categories:
            return 'spending_analysis', {
                'message': "You haven't recorded any expenses this month yet.",
                'suggestions': ["Add an expense like 'Add coffee ₹150'"]
            }
        
        # Create response message
        top_categories = sorted_categories[:3]
        message = f"📊 This month you've spent ₹{total_spending:.2f} total.\n\nTop categories:\n"
        
        for category, amount in top_categories:
            percentage = (amount / total_spending * 100) if total_spending > 0 else 0
            message += f"• {category}: ₹{amount:.2f} ({percentage:.1f}%)\n"
        
        return 'spending_analysis', {
            'message': message.strip(),
            'action_taken': 'provided_spending_analysis',
            'data': {
                'total_spending': total_spending,
                'categories': dict(sorted_categories),
                'period': 'current_month'
            }
        }
        
    except Exception as e:
        return 'spending_error', {
            'message': "Sorry, I couldn't analyze your spending right now."
        }

def handle_budget_intent(message, user):
    """Handle budget-related inquiries"""
    try:
        # Get active budgets
        budgets_result = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not budgets_result.data:
            return 'budget_info', {
                'message': "You don't have any active budgets yet. Would you like me to help you create one?",
                'suggestions': [
                    "Create a food budget for ₹5000",
                    "Set up monthly budgets",
                    "Show budget templates"
                ]
            }
        
        # Simple budget summary
        budget_count = len(budgets_result.data)
        total_budget = sum(float(b['amount']) for b in budgets_result.data)
        
        return 'budget_info', {
            'message': f"📋 You have {budget_count} active budgets totaling ₹{total_budget:.2f}. Check the Budgets tab for details!",
            'action_taken': 'provided_budget_info',
            'data': {
                'budget_count': budget_count,
                'total_budget': total_budget
            },
            'suggestions': [
                "Show budget overview",
                "How much did I spend vs budget?",
                "Create a new budget"
            ]
        }
        
    except Exception as e:
        return 'budget_error', {
            'message': "Sorry, I couldn't retrieve your budget information right now."
        }

def handle_bills_intent(message, user):
    """Handle bills and payment inquiries"""
    try:
        # Get upcoming bills
        today = datetime.now().date()
        next_week = today + timedelta(days=7)
        
        bills_result = supabase_client.table('bills').select('*').eq('user_id', user['id']).eq('is_paid', False)
        bills_result = bills_result.gte('due_date', today.isoformat()).lte('due_date', next_week.isoformat())
        
        result = bills_result.execute()
        
        if not result.data:
            return 'bills_info', {
                'message': "🎉 No bills due in the next 7 days!",
                'suggestions': ["Add a new bill", "Show all bills", "Mark bill as paid"]
            }
        
        bills_message = f"📋 You have {len(result.data)} bills due in the next 7 days:\n\n"
        total_due = 0
        
        for bill in result.data:
            due_date = datetime.fromisoformat(bill['due_date']).strftime('%b %d')
            amount = float(bill['amount'])
            bills_message += f"• {bill['name']}: ₹{amount:.2f} (due {due_date})\n"
            total_due += amount
        
        bills_message += f"\nTotal due: ₹{total_due:.2f}"
        
        return 'bills_info', {
            'message': bills_message,
            'action_taken': 'provided_bills_info',
            'data': {
                'bills_count': len(result.data),
                'total_due': total_due,
                'bills': result.data
            }
        }
        
    except Exception as e:
        return 'bills_error', {
            'message': "Sorry, I couldn't retrieve your bills information right now."
        }