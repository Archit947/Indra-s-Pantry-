import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

const parseBooleanField = (value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
};

const parsePriceField = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const parseStockField = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

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
  const { category_id, name, description, price, image_url, is_available, stock } = req.body;
  const parsedPrice = parsePriceField(price);
  const parsedStock = parseStockField(stock);
  const parsedAvailability = parseBooleanField(is_available);

  if (!name?.trim()) {
    sendError(res, 'Name is required', 400);
    return;
  }

  if (parsedPrice === null) {
    sendError(res, 'Price must be a valid number 0 or greater', 400);
    return;
  }

  if (parsedStock === null) {
    sendError(res, 'Stock must be a whole number 0 or greater', 400);
    return;
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      category_id: category_id || null,
      name: name.trim(),
      description: description?.trim() || null,
      price: parsedPrice,
      image_url: image_url || null,
      stock: parsedStock,
      is_available: parsedAvailability ?? true,
    })
    .select('*, categories(id, name, description)')
    .single();

  if (error) { sendError(res, 'Failed to create item: ' + error.message, 500); return; }
  sendSuccess(res, data, 'Item created', 201);
};

// PUT /api/items/:id  [admin]
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  const { category_id, name, description, price, image_url, is_available, stock } = req.body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (category_id !== undefined) updates.category_id = category_id || null;
  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      sendError(res, 'Name cannot be empty', 400);
      return;
    }
    updates.name = trimmedName;
  }
  if (description !== undefined) updates.description = String(description).trim() || null;
  if (price !== undefined) {
    const parsedPrice = parsePriceField(price);
    if (parsedPrice === null) {
      sendError(res, 'Price must be a valid number 0 or greater', 400);
      return;
    }
    updates.price = parsedPrice;
  }
  if (image_url !== undefined) updates.image_url = image_url;
  if (stock !== undefined) {
    const parsedStock = parseStockField(stock);
    if (parsedStock === null) {
      sendError(res, 'Stock must be a whole number 0 or greater', 400);
      return;
    }
    updates.stock = parsedStock;
  }
  if (is_available !== undefined) {
    const parsedAvailability = parseBooleanField(is_available);
    if (parsedAvailability === undefined) {
      sendError(res, 'is_available must be true or false', 400);
      return;
    }
    updates.is_available = parsedAvailability;
  }

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
