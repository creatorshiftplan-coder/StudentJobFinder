import { Request, Response, NextFunction } from "express";
import { getSupabase } from "./supabase";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const supabase = getSupabase();

  // If Supabase not enabled, use demo user
  if (!supabase) {
    req.userId = "demo-user-id";
    req.userEmail = "demo@example.com";
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const supabase = getSupabase();

  if (!supabase) {
    req.userId = "demo-user-id";
    req.userEmail = "demo@example.com";
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      req.userId = undefined;
      return next();
    }

    const token = authHeader.substring(7);
    const { data } = await supabase.auth.getUser(token);

    if (data.user) {
      req.userId = data.user.id;
      req.userEmail = data.user.email;
    }
  } catch {
    // If auth fails, continue as unauthenticated
  }

  next();
}
