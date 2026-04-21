import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const showAll = req.query.all === 'true' && req.user?.role === 'admin';

  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (!showAll) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) { sendError(res, 'Failed to fetch categories', 500); return; }
  sendSuccess(res, data);
};

// GET /api/categories/:id
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) { sendError(res, 'Category not found', 404); return; }
  sendSuccess(res, data);
};

// POST /api/categories  [admin]
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description, image_url } = req.body;

  if (!name?.trim()) {
    sendError(res, 'Category name is required', 400);
    return;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: name.trim(),
      description: description || null,
      image_url: typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { sendError(res, 'Category name already exists', 409); return; }
    sendError(res, 'Failed to create category', 500);
    return;
  }

  sendSuccess(res, data, 'Category created', 201);
};

// PUT /api/categories/:id  [admin]
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description, image_url, is_active } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : name;
  if (description !== undefined) updates.description = description || null;
  if (image_url !== undefined) {
    updates.image_url = typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;
  }
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) { sendError(res, 'Failed to update category', 500); return; }
  sendSuccess(res, data, 'Category updated');
};

// DELETE /api/categories/:id  [admin]
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id);

  if (error) { sendError(res, 'Failed to delete category', 500); return; }
  sendSuccess(res, null, 'Category deleted');
};
