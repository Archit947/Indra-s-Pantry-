"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItem = exports.updateItem = exports.createItem = exports.getItemById = exports.getItems = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/items  — supports ?category_id=&search=&all=true(admin)
const getItems = async (req, res) => {
    const { category_id, search, all } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const showAll = all === 'true' && isAdmin;
    let query = supabase_1.supabase
        .from('items')
        .select('*, categories(id, name)')
        .order('created_at', { ascending: false });
    if (!showAll) {
        query = query.eq('is_available', true);
    }
    if (category_id) {
        query = query.eq('category_id', category_id);
    }
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query;
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch items', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getItems = getItems;
// GET /api/items/:id
const getItemById = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('items')
        .select('*, categories(id, name)')
        .eq('id', req.params.id)
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Item not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getItemById = getItemById;
// POST /api/items  [admin]  — image handled by upload middleware
const createItem = async (req, res) => {
    const { category_id, name, description, price, image_url, is_available } = req.body;
    if (!name?.trim() || price === undefined) {
        (0, response_1.sendError)(res, 'Name and price are required', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('items')
        .insert({
        category_id: category_id || null,
        name: name.trim(),
        description: description || null,
        price: parseFloat(price),
        image_url: image_url || null,
        is_available: is_available !== undefined ? Boolean(is_available) : true,
    })
        .select('*, categories(id, name)')
        .single();
    if (error) {
        (0, response_1.sendError)(res, 'Failed to create item: ' + error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Item created', 201);
};
exports.createItem = createItem;
// PUT /api/items/:id  [admin]
const updateItem = async (req, res) => {
    const { category_id, name, description, price, image_url, is_available } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (category_id !== undefined)
        updates.category_id = category_id || null;
    if (name !== undefined)
        updates.name = name.trim();
    if (description !== undefined)
        updates.description = description;
    if (price !== undefined)
        updates.price = parseFloat(price);
    if (image_url !== undefined)
        updates.image_url = image_url;
    if (is_available !== undefined)
        updates.is_available = Boolean(is_available);
    const { data, error } = await supabase_1.supabase
        .from('items')
        .update(updates)
        .eq('id', req.params.id)
        .select('*, categories(id, name)')
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Failed to update item', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Item updated');
};
exports.updateItem = updateItem;
// DELETE /api/items/:id  [admin]
const deleteItem = async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('items')
        .delete()
        .eq('id', req.params.id);
    if (error) {
        (0, response_1.sendError)(res, 'Failed to delete item', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 'Item deleted');
};
exports.deleteItem = deleteItem;
