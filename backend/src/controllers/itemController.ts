import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/items  — supports ?category_id=&search=&all=true(admin)
export const getItems = async (req: Request, res: Response): Promise<void> => {
  const { category_id, search, all } = req.query;
  const isAdmin = req.user?.role === 'admin';
  const showAll = all === 'true' && isAdmin;

  let query = supabase
    .from('items')
    .select('*, categories(id, name, description)')
    .order('created_at', { ascending: false });

  if (!showAll) {
    query = query.eq('is_available', true);
  }
  if (category_id) {
    query = query.eq('category_id', category_id as string);
  }
  if (search) {
    query = query.ilike('name', `%${search as string}%`);
  }

  const { data, error } = await query;
  if (error) { sendError(res, 'Failed to fetch items', 500); return; }
  sendSuccess(res, data);
};

// GET /api/items/:id
export const getItemById = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('items')
    .select('*, categories(id, name, description)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) { sendError(res, 'Item not found', 404); return; }
  sendSuccess(res, data);
};

// POST /api/items  [admin]  — image handled by upload middleware
export const createItem = async (req: Request, res: Response): Promise<void> => {
  const { category_id, name, description, price, image_url, is_available } = req.body;

  if (!name?.trim() || price === undefined) {
    sendError(res, 'Name and price are required', 400);
    return;
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      category_id: category_id || null,
      name: name.trim(),
      description: description || null,
      price: parseFloat(price),
      image_url: image_url || null,
      is_available: is_available !== undefined ? Boolean(is_available) : true,
    })
    .select('*, categories(id, name, description)')
    .single();

  if (error) { sendError(res, 'Failed to create item: ' + error.message, 500); return; }
  sendSuccess(res, data, 'Item created', 201);
};

// PUT /api/items/:id  [admin]
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  const { category_id, name, description, price, image_url, is_available } = req.body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (category_id !== undefined) updates.category_id = category_id || null;
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = parseFloat(price);
  if (image_url !== undefined) updates.image_url = image_url;
  if (is_available !== undefined) updates.is_available = Boolean(is_available);

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', req.params.id)
    .select('*, categories(id, name, description)')
    .single();

  if (error || !data) { sendError(res, 'Failed to update item', 500); return; }
  sendSuccess(res, data, 'Item updated');
};

// DELETE /api/items/:id  [admin]
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', req.params.id);

  if (error) { sendError(res, 'Failed to delete item', 500); return; }
  sendSuccess(res, null, 'Item deleted');
};
