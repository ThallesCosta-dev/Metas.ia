/*
  # Create Goals Application Schema

  ## Overview
  This migration creates a complete financial goal tracking application schema with:
  - User management with authentication
  - Goals and subgoals tracking
  - Financial transactions
  - Currency conversion support
  - Gamification (achievements, points, streaks)
  - Social features (sharing, comments)
  - Reminders and calendar integration

  ## New Tables

  ### 1. `users`
  - Core user account information
  - `id` (uuid, primary key) - Auto-generated user ID
  - `username` (text, unique) - Unique username
  - `email` (text, unique) - User email
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `default_currency` (text) - Preferred currency (USD, BRL, EUR)
  - `timezone` (text) - User timezone
  - `language` (text) - Preferred language
  - `theme` (text) - UI theme preference
  - `last_login` (timestamptz) - Last login timestamp
  - `is_active` (boolean) - Account active status

  ### 2. `goals`
  - Main goals tracking
  - Financial and non-financial goals
  - Progress tracking with percentage
  - Priority and status management
  - Category organization

  ### 3. `subgoals`
  - Breaking down goals into smaller tasks
  - Financial target tracking
  - Dependency management between subgoals
  - Progress and completion tracking

  ### 4. `financial_transactions`
  - Deposits and withdrawals for goals
  - Multi-currency support with conversion
  - Transaction history and audit trail

  ### 5. `currency_rates`
  - Exchange rates between currencies
  - Updated periodically
  - Supports USD, BRL, EUR

  ### 6. `goal_notes`
  - Progress notes and reflections
  - Different note types (progress, challenge, etc.)

  ### 7. `goal_attachments`
  - File uploads related to goals
  - Documents, images, etc.

  ### 8. `reminders`
  - Goal deadline reminders
  - Email and push notification support

  ### 9. `calendar_exports`
  - Integration with external calendars
  - Google Calendar, Apple Calendar, ICS format

  ### 10. `achievements`
  - Gamification badges and rewards
  - Points system
  - Categories for different achievement types

  ### 11. `user_achievements`
  - Tracks unlocked achievements per user
  - Timestamp of unlock

  ### 12. `goal_templates`
  - Reusable goal templates
  - Public and private templates

  ### 13. `shared_goals`
  - Goal sharing with other users
  - Permission levels (view, edit, admin)

  ### 14. `goal_comments`
  - Comments and discussions on goals
  - Threaded comments support

  ### 15. `activity_log`
  - Audit trail of user actions
  - IP and user agent tracking

  ### 16. `user_statistics`
  - Aggregated user stats
  - Streaks, totals, points
  - Performance metrics

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Shared goals use explicit permission checks
  - Service role bypasses RLS for admin operations

  ## Important Notes
  - All timestamps use timestamptz for timezone support
  - Foreign keys have appropriate CASCADE/SET NULL behavior
  - Indexes optimize common query patterns
  - Default values ensure data consistency
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  default_currency text DEFAULT 'BRL' CHECK (default_currency IN ('USD', 'BRL', 'EUR')),
  timezone text DEFAULT 'America/Sao_Paulo',
  language text DEFAULT 'pt-BR',
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue', 'cancelled')),
  is_financial boolean DEFAULT false,
  target_value decimal(15, 2),
  current_value decimal(15, 2) DEFAULT 0.00,
  currency text CHECK (currency IN ('USD', 'BRL', 'EUR')),
  start_date date,
  due_date date,
  completed_at timestamptz,
  progress_percentage decimal(5, 2) DEFAULT 0.00,
  color_code text,
  icon text,
  is_shared boolean DEFAULT false,
  parent_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_due_date ON goals(due_date);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id);

-- 3. Subgoals table
CREATE TABLE IF NOT EXISTS subgoals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_financial boolean DEFAULT false,
  target_value decimal(15, 2),
  current_value decimal(15, 2) DEFAULT 0.00,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  completed_at timestamptz,
  position int DEFAULT 0,
  depends_on_subgoal_id uuid REFERENCES subgoals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subgoals_goal ON subgoals(goal_id);
CREATE INDEX IF NOT EXISTS idx_subgoals_status ON subgoals(status);

-- 4. Financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  subgoal_id uuid REFERENCES subgoals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(15, 2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('USD', 'BRL', 'EUR')),
  converted_amount decimal(15, 2),
  conversion_rate decimal(10, 6),
  transaction_type text DEFAULT 'deposit' CHECK (transaction_type IN ('deposit', 'withdrawal', 'adjustment')),
  description text,
  transaction_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_goal ON financial_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(transaction_date);

-- 5. Currency rates table
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency text NOT NULL CHECK (from_currency IN ('USD', 'BRL', 'EUR')),
  to_currency text NOT NULL CHECK (to_currency IN ('USD', 'BRL', 'EUR')),
  rate decimal(10, 6) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_pair ON currency_rates(from_currency, to_currency);

-- 6. Goal notes table
CREATE TABLE IF NOT EXISTS goal_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('progress', 'reflection', 'challenge', 'general')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_notes_goal ON goal_notes(goal_id);

-- 7. Goal attachments table
CREATE TABLE IF NOT EXISTS goal_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size int,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_attachments_goal ON goal_attachments(goal_id);

-- 8. Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type text DEFAULT 'both' CHECK (reminder_type IN ('email', 'push', 'both')),
  remind_before_days int DEFAULT 1,
  custom_time time,
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_goal ON reminders(goal_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);

-- 9. Calendar exports table
CREATE TABLE IF NOT EXISTS calendar_exports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_type text NOT NULL CHECK (calendar_type IN ('google', 'apple', 'ics')),
  event_id text,
  exported_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_exports_goal ON calendar_exports(goal_id);

-- 10. Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  points int DEFAULT 0,
  category text,
  created_at timestamptz DEFAULT now()
);

-- 11. User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- 12. Goal templates table
CREATE TABLE IF NOT EXISTS goal_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text,
  is_financial boolean DEFAULT false,
  suggested_duration_days int,
  is_public boolean DEFAULT false,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(category);
CREATE INDEX IF NOT EXISTS idx_goal_templates_public ON goal_templates(is_public);

-- 13. Shared goals table
CREATE TABLE IF NOT EXISTS shared_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level text DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  shared_at timestamptz DEFAULT now(),
  UNIQUE (goal_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_goals_shared_with ON shared_goals(shared_with_user_id);

-- 14. Goal comments table
CREATE TABLE IF NOT EXISTS goal_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  parent_comment_id uuid REFERENCES goal_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_comments_goal ON goal_comments(goal_id);

-- 15. Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);

-- 16. User statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_goals int DEFAULT 0,
  completed_goals int DEFAULT 0,
  total_points int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  total_saved_amount decimal(15, 2) DEFAULT 0.00,
  last_calculated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Insert initial currency rates
INSERT INTO currency_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'USD', 1.00),
  ('USD', 'BRL', 5.15),
  ('USD', 'EUR', 0.92),
  ('BRL', 'USD', 0.194),
  ('BRL', 'BRL', 1.00),
  ('BRL', 'EUR', 0.179),
  ('EUR', 'USD', 1.09),
  ('EUR', 'BRL', 5.61),
  ('EUR', 'EUR', 1.00)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Insert initial achievements
INSERT INTO achievements (code, name, description, icon, points, category) VALUES
  ('first_goal', 'Primeira Meta', 'Criou sua primeira meta', '🎯', 10, 'beginner'),
  ('goal_master', 'Mestre das Metas', 'Completou 10 metas', '👑', 100, 'completion'),
  ('streak_7', 'Semana Produtiva', 'Manteve 7 dias de sequência', '🔥', 50, 'consistency'),
  ('financial_saver', 'Poupador', 'Economizou R$ 1000', '💰', 75, 'financial'),
  ('speed_demon', 'Velocista', 'Completou uma meta antes do prazo', '⚡', 25, 'efficiency'),
  ('ambitious', 'Ambicioso', 'Criou 5 metas', '🚀', 30, 'beginner'),
  ('polymath', 'Polímata', 'Criou metas em todas as categorias', '🌟', 80, 'completion'),
  ('unstoppable', 'Imparável', 'Manteve 30 dias de sequência', '⚡⚡', 150, 'consistency')
ON CONFLICT (code) DO NOTHING;

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgoals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for goals table
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shared_goals
      WHERE shared_goals.goal_id = goals.id
      AND shared_goals.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shared_goals
      WHERE shared_goals.goal_id = goals.id
      AND shared_goals.shared_with_user_id = auth.uid()
      AND shared_goals.permission_level IN ('edit', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shared_goals
      WHERE shared_goals.goal_id = goals.id
      AND shared_goals.shared_with_user_id = auth.uid()
      AND shared_goals.permission_level IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subgoals table
CREATE POLICY "Users can view subgoals of accessible goals"
  ON subgoals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = subgoals.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert subgoals for own goals"
  ON subgoals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = subgoals.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subgoals of own goals"
  ON subgoals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = subgoals.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
          AND shared_goals.permission_level IN ('edit', 'admin')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = subgoals.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
          AND shared_goals.permission_level IN ('edit', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can delete subgoals of own goals"
  ON subgoals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = subgoals.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- RLS Policies for financial_transactions table
CREATE POLICY "Users can view own transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON financial_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for currency_rates table (read-only for all authenticated users)
CREATE POLICY "Anyone can view currency rates"
  ON currency_rates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for goal_notes table
CREATE POLICY "Users can view notes of accessible goals"
  ON goal_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_notes.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert notes for accessible goals"
  ON goal_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_notes.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own notes"
  ON goal_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON goal_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for goal_attachments table
CREATE POLICY "Users can view attachments of accessible goals"
  ON goal_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_attachments.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert attachments for accessible goals"
  ON goal_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_attachments.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete own attachments"
  ON goal_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reminders table
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_exports table
CREATE POLICY "Users can view own calendar exports"
  ON calendar_exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar exports"
  ON calendar_exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar exports"
  ON calendar_exports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for achievements table (read-only for all authenticated users)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements table
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for goal_templates table
CREATE POLICY "Anyone can view public templates"
  ON goal_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR creator_user_id = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON goal_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can update own templates"
  ON goal_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_user_id)
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can delete own templates"
  ON goal_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_user_id);

-- RLS Policies for shared_goals table
CREATE POLICY "Users can view shares involving them"
  ON shared_goals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_user_id
    OR auth.uid() = shared_with_user_id
  );

CREATE POLICY "Goal owners can share their goals"
  ON shared_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Goal owners can update shares"
  ON shared_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Goal owners can delete shares"
  ON shared_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- RLS Policies for goal_comments table
CREATE POLICY "Users can view comments of accessible goals"
  ON goal_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_comments.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert comments on accessible goals"
  ON goal_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_comments.goal_id
      AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_goals
          WHERE shared_goals.goal_id = goals.id
          AND shared_goals.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON goal_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON goal_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for activity_log table
CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_statistics table
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON user_statistics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON user_statistics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);