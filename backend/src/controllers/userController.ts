import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/users  [admin]
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, phone, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) { sendError(res, 'Failed to fetch users', 500); return; }
  sendSuccess(res, data);
};

// GET /api/users/:id  [admin]
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, phone, role, is_active, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !data) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, data);
};

// PATCH /api/users/:id/status  [admin] — activate / deactivate account
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { is_active } = req.body;

  if (is_active === undefined) {
    sendError(res, 'is_active field is required', 400);
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .update({ is_active: Boolean(is_active) })
    .eq('id', req.params.id)
    .select('id, email, name, role, is_active')
    .single();

  if (error || !data) { sendError(res, 'Failed to update user', 500); return; }
  sendSuccess(res, data, 'User status updated');
};

// PUT /api/users/profile  — update own profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { name, phone } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim() || null;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user!.id)
    .select('id, email, name, phone, role, created_at')
    .single();

  if (error || !data) { sendError(res, 'Failed to update profile', 500); return; }
  sendSuccess(res, data, 'Profile updated');
};
