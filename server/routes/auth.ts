import { RequestHandler } from "express";
import supabase from "../supabase";
import { z } from "zod";

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


export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${data.email || data.username},username.eq.${data.username}`)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user in users table
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        username: data.username,
        email: data.email || data.username,
        full_name: data.full_name || data.username,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error("Failed to create user:", userError);
      return res.status(500).json({ error: "Registration failed" });
    }

    // Create user statistics record
    await supabase
      .from("user_statistics")
      .insert({ user_id: newUser.id });

    res.status(201).json({
      message: "User registered successfully",
      user: { userId: newUser.id, username: newUser.username, email: newUser.email },
    });
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

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("email", data.email)
      .maybeSingle();

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    res.json({
      message: "Login successful",
      user: {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
    });
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

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, email, full_name, avatar_url, default_currency, timezone, language, theme, created_at, last_login")
      .eq("id", userId)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    const {
      full_name,
      avatar_url,
      default_currency,
      timezone,
      language,
      theme,
    } = req.body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (default_currency !== undefined) updates.default_currency = default_currency;
    if (timezone !== undefined) updates.timezone = timezone;
    if (language !== undefined) updates.language = language;
    if (theme !== undefined) updates.theme = theme;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
