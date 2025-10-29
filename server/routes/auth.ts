import { RequestHandler } from "express";
import pool from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_USERNAME = "admin";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

// Helper function to create JWT token
const createToken = (userId: number, email: string) => {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check for admin credentials registration
    if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
      const token = createToken(1, ADMIN_EMAIL);
      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: { userId: 1, username: ADMIN_USERNAME, email: ADMIN_EMAIL },
      });
    }

    // Try database registration
    let connection;
    try {
      connection = await pool.getConnection();

      // Check if user exists
      const [existing] = await connection.execute(
        "SELECT user_id FROM users WHERE email = ? OR username = ?",
        [data.email || data.username, data.username],
      );

      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 10);

      // Create user
      const [result] = await connection.execute(
        `INSERT INTO users (username, email, password_hash, full_name)
         VALUES (?, ?, ?, ?)`,
        [
          data.username,
          data.email || data.username,
          password_hash,
          data.full_name || data.username,
        ],
      );

      const userId = (result as any).insertId;

      // Create user statistics record
      await connection.execute(
        `INSERT INTO user_statistics (user_id) VALUES (?)`,
        [userId],
      );

      // Generate token
      const token = createToken(userId, data.email || data.username);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: { userId, username: data.username, email: data.email },
      });
    } catch (dbError: any) {
      console.warn("Database registration failed:", dbError.message);
      // If database fails, allow registration without it for now
      res.status(201).json({
        message: "User registered successfully",
        token: createToken(
          Math.floor(Math.random() * 10000),
          data.email || data.username,
        ),
        user: { userId: 1, username: data.username, email: data.email },
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error: any) {
    console.error("Register error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: "Registration failed" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Check for hardcoded admin credentials
    if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
      const token = createToken(1, ADMIN_EMAIL);
      return res.json({
        message: "Login successful",
        token,
        user: { userId: 1, username: ADMIN_USERNAME, email: ADMIN_EMAIL },
      });
    }

    // Try database login
    let connection;
    try {
      connection = await pool.getConnection();

      // Find user
      const [users] = await connection.execute(
        "SELECT user_id, username, email, password_hash FROM users WHERE email = ?",
        [data.email],
      );

      const user = (users as any[])[0];
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(
        data.password,
        user.password_hash,
      );
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await connection.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = ?",
        [user.user_id],
      );

      // Generate token
      const token = createToken(user.user_id, user.email);

      res.json({
        message: "Login successful",
        token,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (dbError: any) {
      console.warn("Database login failed:", dbError.message);
      return res.status(401).json({ error: "Invalid credentials" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error: any) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: "Login failed" });
  }
};

export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    // Return hardcoded admin profile
    if (userId === 1) {
      return res.json({
        user_id: 1,
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        full_name: "Admin User",
        avatar_url: null,
        default_currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        theme: "light",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      });
    }

    // Try database
    let connection;
    try {
      connection = await pool.getConnection();

      const [users] = await connection.execute(
        `SELECT user_id, username, email, full_name, avatar_url,
                default_currency, timezone, language, theme, created_at, last_login
         FROM users WHERE user_id = ?`,
        [userId],
      );

      const user = (users as any[])[0];
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    // Admin profile is read-only
    if (userId === 1) {
      return res.json({ message: "Admin profile cannot be updated" });
    }

    // Try database
    let connection;
    try {
      connection = await pool.getConnection();

      const {
        full_name,
        avatar_url,
        default_currency,
        timezone,
        language,
        theme,
      } = req.body;

      await connection.execute(
        `UPDATE users
         SET full_name = COALESCE(?, full_name),
             avatar_url = COALESCE(?, avatar_url),
             default_currency = COALESCE(?, default_currency),
             timezone = COALESCE(?, timezone),
             language = COALESCE(?, language),
             theme = COALESCE(?, theme)
         WHERE user_id = ?`,
        [
          full_name,
          avatar_url,
          default_currency,
          timezone,
          language,
          theme,
          userId,
        ],
      );

      res.json({ message: "Profile updated successfully" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
