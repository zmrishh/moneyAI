# MoneyAI Database Schema - ASCII Visualization

## 📊 **Core Tables Structure**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ auth_id (uuid, FK)         │ email (varchar)          │
│ full_name (varchar)        │ avatar_url (varchar)       │ phone (varchar)          │
│ country_code (varchar)     │ currency (varchar)         │ timezone (varchar)       │
│ is_verified (boolean)      │ is_active (boolean)        │ created_at (timestamp)   │
│ updated_at (timestamp)     │ last_login (timestamp)     │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (1:N)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                TRANSACTIONS                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ amount (decimal)         │
│ description (varchar)      │ category_id (uuid, FK)     │ category_name (varchar)  │
│ transaction_type (enum)    │ source (enum)              │ date (timestamp)         │
│ location (varchar)         │ merchant (varchar)         │ notes (text)             │
│ tags (jsonb)               │ receipt_url (varchar)      │ is_recurring (boolean)   │
│ recurring_id (uuid)        │ created_at (timestamp)     │ updated_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 CATEGORIES                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ name (varchar)             │ icon (varchar)           │
│ color (varchar)            │ parent_id (uuid, FK)       │ is_system (boolean)      │
│ created_at (timestamp)     │                            │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  BUDGETS                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ name (varchar)           │
│ category_id (uuid, FK)     │ amount (decimal)           │ spent_amount (decimal)   │
│ period (enum)              │ start_date (date)          │ end_date (date)          │
│ is_active (boolean)        │ alert_threshold (integer)  │ color (varchar)          │
│ icon (varchar)             │ created_at (timestamp)     │ updated_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   GOALS                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ title (varchar)          │
│ description (text)         │ target_amount (decimal)    │ current_amount (decimal) │
│ target_date (date)         │ goal_type (enum)           │ priority (enum)          │
│ category (varchar)         │ auto_save_amount (decimal) │ auto_save_frequency (enum)│
│ is_completed (boolean)     │ completed_at (timestamp)   │ created_at (timestamp)   │
│ updated_at (timestamp)     │                            │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (1:N)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                MILESTONES                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ goal_id (uuid, FK)         │ percentage (integer)     │
│ amount (decimal)           │ achieved (boolean)         │ achieved_date (timestamp)│
│ created_at (timestamp)     │                            │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   BILLS                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ name (varchar)           │
│ amount (decimal)           │ due_date (date)            │ category (varchar)       │
│ is_recurring (boolean)     │ recurrence_pattern (enum)  │ is_paid (boolean)        │
│ payment_date (timestamp)   │ late_fee (decimal)         │ auto_pay (boolean)       │
│ reminder_days (integer)    │ created_at (timestamp)     │ updated_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   DEBTS                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ debt_type (enum)         │
│ person_name (varchar)      │ person_contact (varchar)   │ amount (decimal)         │
│ original_amount (decimal)  │ description (text)         │ due_date (date)          │
│ created_date (date)        │ is_settled (boolean)       │ settled_date (timestamp) │
│ created_at (timestamp)     │ updated_at (timestamp)     │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (1:N)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DEBT_PAYMENTS                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ debt_id (uuid, FK)         │ amount (decimal)         │
│ date (timestamp)           │ note (text)                │ created_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SUBSCRIPTIONS                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ name (varchar)           │
│ amount (decimal)           │ billing_cycle (enum)       │ next_billing_date (date) │
│ category (varchar)         │ is_active (boolean)        │ auto_renew (boolean)     │
│ reminder_days (integer)    │ created_at (timestamp)     │ updated_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (1:N)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PRICE_CHANGES                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ subscription_id (uuid, FK) │ old_amount (decimal)     │
│ new_amount (decimal)       │ change_date (date)         │ reason (varchar)         │
│ created_at (timestamp)     │                            │                          │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             AI_INTERACTIONS                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)              │ user_id (uuid, FK)         │ session_id (uuid)        │
│ user_message (text)        │ ai_response (text)         │ intent (varchar)         │
│ confidence (float)         │ action_taken (varchar)     │ created_at (timestamp)   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 **Relationship Map**

```
                             ┌─────────────┐
                             │    USERS    │
                             │   (Master)  │
                             └──────┬──────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │TRANSACTIONS  │    │   BUDGETS    │    │    GOALS     │
        │   (Core)     │    │  (Planning)  │    │ (Targets)    │
        └──────────────┘    └──────────────┘    └──────┬───────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │ MILESTONES   │
                                               │ (Progress)   │
                                               └──────────────┘

        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │    BILLS     │    │    DEBTS     │    │SUBSCRIPTIONS │
        │ (Recurring)  │    │ (Personal)   │    │ (Services)   │
        └──────────────┘    └──────┬───────┘    └──────┬───────┘
                                   │                   │
                                   ▼                   ▼
                            ┌──────────────┐    ┌──────────────┐
                            │DEBT_PAYMENTS │    │PRICE_CHANGES │
                            │ (History)    │    │ (Tracking)   │
                            └──────────────┘    └──────────────┘

        ┌──────────────┐    ┌──────────────┐
        │AI_INTERACTIONS│
        │ (Chat/NLP)   │
        └──────────────┘    └──────────────┘

                    ┌──────────────┐
                    │ CATEGORIES   │
                    │ (Taxonomy)   │
                    └──────────────┘
```

## 📋 **Table Summary**

```
╔════════════════╦═══════════╦═══════════╦════════════════════════════╗
║ TABLE NAME     ║ RECORDS   ║ FEATURES  ║ PRIMARY PURPOSE            ║
╠════════════════╬═══════════╬═══════════╬════════════════════════════╣
║ users          ║ Thousands ║ Auth/Prof ║ User management & profiles ║
║ transactions   ║ Millions  ║ Core/AI   ║ Financial transaction data ║
║ categories     ║ Hundreds  ║ Taxonomy  ║ Transaction categorization ║
║ budgets        ║ Thousands ║ Planning  ║ Spending limit tracking    ║
║ goals          ║ Thousands ║ Targets   ║ Financial goal setting     ║
║ milestones     ║ Thousands ║ Progress  ║ Goal achievement tracking  ║
║ bills          ║ Thousands ║ Recurring ║ Bill payment management    ║
║ debts          ║ Thousands ║ Personal  ║ Personal debt tracking     ║
║ debt_payments  ║ Thousands ║ History   ║ Debt payment history       ║
║ subscriptions  ║ Thousands ║ Services  ║ Subscription management    ║
║ price_changes  ║ Thousands ║ Tracking  ║ Subscription price history ║
║ ai_interactions║ Millions  ║ AI/NLP    ║ Chat & parsing interactions║
╚════════════════╩═══════════╩═══════════╩════════════════════════════╝
```

## 🔍 **Key Indexes & Performance**

```
┌─── PERFORMANCE INDEXES ────────────────────────────────────────┐
│                                                                │
│ transactions:                                                  │
│   ├── idx_transactions_user_date (user_id, date DESC)         │
│   ├── idx_transactions_category (category_name)               │
│   └── idx_transactions_source (source)                        │
│                                                                │
│ budgets:                                                       │
│   ├── idx_budgets_period (period, start_date, end_date)       │
│   └── idx_budgets_user_active (user_id, is_active)            │
│                                                                │
│ goals:                                                         │
│   ├── idx_goals_user_active (user_id, is_completed)           │
│   └── idx_goals_target_date (target_date)                     │
│                                                                │
│                                                                │
│ ai_interactions:                                               │
│   ├── idx_ai_user_session (user_id, session_id)               │
│   └── idx_ai_created_at (created_at DESC)                     │
└────────────────────────────────────────────────────────────────┘
```

## 🛡️ **Security & Constraints**

```
┌─── ROW LEVEL SECURITY (RLS) ──────────────────────────────────┐
│                                                               │
│ ALL USER DATA TABLES:                                         │
│   ├── SELECT: user_id = auth.uid() [from users table]        │
│   ├── INSERT: user_id = auth.uid() [from users table]        │
│   ├── UPDATE: user_id = auth.uid() [from users table]        │
│   └── DELETE: user_id = auth.uid() [from users table]        │
│                                                               │
│ FOREIGN KEY CONSTRAINTS:                                      │
│   ├── All child tables → users.id ON DELETE CASCADE          │
│   ├── milestones → goals.id ON DELETE CASCADE                │
│   ├── debt_payments → debts.id ON DELETE CASCADE             │
│   └── price_changes → subscriptions.id ON DELETE CASCADE     │
└───────────────────────────────────────────────────────────────┘
```

This ASCII visualization provides a clear, text-based representation of your MoneyAI database schema with all table structures, relationships, and key technical details.