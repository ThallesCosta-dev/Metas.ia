import { RequestHandler } from "express";
import pool from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const handleRegister: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const [existing] = await connection.execute(
      "SELECT user_id FROM users WHERE email = ? OR username = ?",
      [data.email, data.username]
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
      [data.username, data.email, password_hash, data.full_name || data.username]
    );
    
    const userId = (result as any).insertId;
    
    // Create user statistics record
    await connection.execute(
      `INSERT INTO user_statistics (user_id) VALUES (?)`,
      [userId]
    );
    
    // Generate token
    const token = jwt.sign({ userId, email: data.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { userId, username: data.username, email: data.email },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ error: "Registration failed" });
  } finally {
    connection.release();
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const [users] = await connection.execute(
      "SELECT user_id, username, email, password_hash FROM users WHERE email = ?",
      [data.email]
    );
    
    const user = (users as any[])[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Update last login
    await connection.execute(
      "UPDATE users SET last_login = NOW() WHERE user_id = ?",
      [user.user_id]
    );
    
    // Generate token
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    
    res.json({
      message: "Login successful",
      token,
      user: { userId: user.user_id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ error: "Login failed" });
  } finally {
    connection.release();
  }
};

export const handleGetProfile: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = (req as any).userId;
    
    const [users] = await connection.execute(
      `SELECT user_id, username, email, full_name, avatar_url, 
              default_currency, timezone, language, theme, created_at, last_login
       FROM users WHERE user_id = ?`,
      [userId]
    );
    
    const user = (users as any[])[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  } finally {
    connection.release();
  }
};

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = (req as any).userId;
    const { full_name, avatar_url, default_currency, timezone, language, theme } = req.body;
    
    await connection.execute(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name),
           avatar_url = COALESCE(?, avatar_url),
           default_currency = COALESCE(?, default_currency),
           timezone = COALESCE(?, timezone),
           language = COALESCE(?, language),
           theme = COALESCE(?, theme)
       WHERE user_id = ?`,
      [full_name, avatar_url, default_currency, timezone, language, theme, userId]
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  } finally {
    connection.release();
  }
};
