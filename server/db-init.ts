import pool from "./db";

const initializeDatabase = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    console.log("🔄 Initializing database schema...");

    // 1. Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar_url VARCHAR(255),
        default_currency ENUM('USD', 'BRL', 'EUR') DEFAULT 'BRL',
        timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
        language VARCHAR(10) DEFAULT 'pt-BR',
        theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Users table created");

    // 2. Goals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goals (
        goal_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        status ENUM('not_started', 'in_progress', 'completed', 'overdue', 'cancelled') DEFAULT 'not_started',
        is_financial BOOLEAN DEFAULT FALSE,
        target_value DECIMAL(15, 2) NULL,
        current_value DECIMAL(15, 2) DEFAULT 0.00,
        currency ENUM('USD', 'BRL', 'EUR') NULL,
        start_date DATE,
        due_date DATE,
        completed_at TIMESTAMP NULL,
        progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
        color_code VARCHAR(7),
        icon VARCHAR(50),
        is_shared BOOLEAN DEFAULT FALSE,
        parent_goal_id INT NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (parent_goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        INDEX idx_user_status (user_id, status),
        INDEX idx_due_date (due_date),
        INDEX idx_category (category),
        INDEX idx_parent (parent_goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Goals table created");

    // 3. Subgoals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subgoals (
        subgoal_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        is_financial BOOLEAN DEFAULT FALSE,
        target_value DECIMAL(15, 2) NULL,
        current_value DECIMAL(15, 2) DEFAULT 0.00,
        status ENUM('not_started', 'in_progress', 'completed', 'cancelled') DEFAULT 'not_started',
        due_date DATE,
        completed_at TIMESTAMP NULL,
        position INT DEFAULT 0,
        depends_on_subgoal_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_subgoal_id) REFERENCES subgoals(subgoal_id) ON DELETE SET NULL,
        INDEX idx_goal (goal_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Subgoals table created");

    // 4. Financial transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        transaction_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NULL,
        subgoal_id INT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency ENUM('USD', 'BRL', 'EUR') NOT NULL,
        converted_amount DECIMAL(15, 2),
        conversion_rate DECIMAL(10, 6),
        transaction_type ENUM('deposit', 'withdrawal', 'adjustment') DEFAULT 'deposit',
        description TEXT,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (subgoal_id) REFERENCES subgoals(subgoal_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id),
        INDEX idx_user (user_id),
        INDEX idx_date (transaction_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Financial transactions table created");

    // 5. Currency rates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS currency_rates (
        rate_id INT PRIMARY KEY AUTO_INCREMENT,
        from_currency ENUM('USD', 'BRL', 'EUR') NOT NULL,
        to_currency ENUM('USD', 'BRL', 'EUR') NOT NULL,
        rate DECIMAL(10, 6) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_pair (from_currency, to_currency),
        INDEX idx_currencies (from_currency, to_currency)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Currency rates table created");

    // 6. Goal notes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goal_notes (
        note_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        note_type ENUM('progress', 'reflection', 'challenge', 'general') DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Goal notes table created");

    // 7. Goal attachments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goal_attachments (
        attachment_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Goal attachments table created");

    // 8. Reminders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        reminder_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        reminder_type ENUM('email', 'push', 'both') DEFAULT 'both',
        remind_before_days INT DEFAULT 1,
        custom_time TIME,
        is_active BOOLEAN DEFAULT TRUE,
        last_sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Reminders table created");

    // 9. Calendar exports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS calendar_exports (
        export_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        calendar_type ENUM('google', 'apple', 'ics') NOT NULL,
        event_id VARCHAR(255),
        exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Calendar exports table created");

    // 10. Achievements table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        achievement_id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        points INT DEFAULT 0,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Achievements table created");

    // 11. User achievements table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_achievement_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        achievement_id INT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_achievement (user_id, achievement_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ User achievements table created");

    // 12. Goal templates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goal_templates (
        template_id INT PRIMARY KEY AUTO_INCREMENT,
        creator_user_id INT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        is_financial BOOLEAN DEFAULT FALSE,
        suggested_duration_days INT,
        is_public BOOLEAN DEFAULT FALSE,
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
        INDEX idx_category (category),
        INDEX idx_public (is_public)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Goal templates table created");

    // 13. Shared goals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shared_goals (
        share_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        owner_user_id INT NOT NULL,
        shared_with_user_id INT NOT NULL,
        permission_level ENUM('view', 'edit', 'admin') DEFAULT 'view',
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_share (goal_id, shared_with_user_id),
        INDEX idx_shared_with (shared_with_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Shared goals table created");

    // 14. Goal comments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goal_comments (
        comment_id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        parent_comment_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES goal_comments(comment_id) ON DELETE CASCADE,
        INDEX idx_goal (goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Goal comments table created");

    // 15. Activity log table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        goal_id INT NULL,
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Activity log table created");

    // 16. User statistics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_statistics (
        stat_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        total_goals INT DEFAULT 0,
        completed_goals INT DEFAULT 0,
        total_points INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        longest_streak INT DEFAULT 0,
        total_saved_amount DECIMAL(15, 2) DEFAULT 0.00,
        last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_stat (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ User statistics table created");

    // Insert initial currency rates
    await connection.execute(`
      INSERT IGNORE INTO currency_rates (from_currency, to_currency, rate) VALUES
      ('USD', 'USD', 1.00),
      ('USD', 'BRL', 5.15),
      ('USD', 'EUR', 0.92),
      ('BRL', 'USD', 0.194),
      ('BRL', 'BRL', 1.00),
      ('BRL', 'EUR', 0.179),
      ('EUR', 'USD', 1.09),
      ('EUR', 'BRL', 5.61),
      ('EUR', 'EUR', 1.00)
    `);
    console.log("✓ Currency rates seeded");

    // Insert initial achievements
    await connection.execute(`
      INSERT IGNORE INTO achievements (code, name, description, icon, points, category) VALUES
      ('first_goal', 'Primeira Meta', 'Criou sua primeira meta', '🎯', 10, 'beginner'),
      ('goal_master', 'Mestre das Metas', 'Completou 10 metas', '👑', 100, 'completion'),
      ('streak_7', 'Semana Produtiva', 'Manteve 7 dias de sequência', '🔥', 50, 'consistency'),
      ('financial_saver', 'Poupador', 'Economizou R$ 1000', '💰', 75, 'financial'),
      ('speed_demon', 'Velocista', 'Completou uma meta antes do prazo', '⚡', 25, 'efficiency'),
      ('ambitious', 'Ambicioso', 'Criou 5 metas', '🚀', 30, 'beginner'),
      ('polymath', 'Polímata', 'Criou metas em todas as categorias', '🌟', 80, 'completion'),
      ('unstoppable', 'Imparável', 'Manteve 30 dias de sequência', '⚡⚡', 150, 'consistency')
    `);
    console.log("✓ Achievements seeded");

    console.log("✅ Database initialized successfully!");
    return true;
  } catch (error: any) {
    console.warn("⚠️ Database initialization warning:", error.message);
    console.warn("Tables may already exist or database connection is not ready yet");
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default initializeDatabase;
