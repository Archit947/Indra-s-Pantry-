import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { User } from '../types';

const generateToken = (user: Pick<User, 'id' | 'email' | 'role'>) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    sendError(res, 'Email, password, and name are required', 400);
    return;
  }
  if (password.length < 6) {
    sendError(res, 'Password must be at least 6 characters', 400);
    return;
  }

  // Check duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    sendError(res, 'Email is already registered', 409);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      phone: phone?.trim() || null,
      role: 'user',
    })
    .select('id, email, name, phone, role, created_at')
    .single();

  if (error || !user) {
    sendError(res, 'Registration failed', 500);
    return;
  }

  const token = generateToken(user as User);
  sendSuccess(res, { user, token }, 'Registration successful', 201);
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(res, 'Email and password are required', 400);
    return;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !user) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const token = generateToken(user as User);
  // Never return the password hash
  const { password_hash: _ph, ...safeUser } = user;
  sendSuccess(res, { user: safeUser, token }, 'Login successful');
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, phone, role, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error || !user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, user);
};
