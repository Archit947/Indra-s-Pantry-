"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItem = exports.updateItem = exports.createItem = exports.getItemById = exports.getItems = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const parseBooleanField = (value) => {
    if (value === undefined)
        return undefined;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
    }
    return undefined;
};
const parsePriceField = (value) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
        return null;
    return parsed;
};
const parseStockField = (value) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
        return null;
    return parsed;
};
// GET /api/items  — supports ?category_id=&search=&all=true(admin)
const getItems = async (req, res) => {
    const { category_id, search, all } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const showAll = all === 'true' && isAdmin;
    let query = supabase_1.supabase
        .from('items')
        .select('*, categories(id, name, description)')
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
        .select('*, categories(id, name, description)')
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
    const { category_id, name, description, price, image_url, is_available, stock } = req.body;
    const parsedPrice = parsePriceField(price);
    const parsedStock = parseStockField(stock);
    const parsedAvailability = parseBooleanField(is_available);
    if (!name?.trim()) {
        (0, response_1.sendError)(res, 'Name is required', 400);
        return;
    }
    if (parsedPrice === null) {
        (0, response_1.sendError)(res, 'Price must be a valid number 0 or greater', 400);
        return;
    }
    if (parsedStock === null) {
        (0, response_1.sendError)(res, 'Stock must be a whole number 0 or greater', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
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
    if (error) {
        (0, response_1.sendError)(res, 'Failed to create item: ' + error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Item created', 201);
};
exports.createItem = createItem;
// PUT /api/items/:id  [admin]
const updateItem = async (req, res) => {
    const { category_id, name, description, price, image_url, is_available, stock } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (category_id !== undefined)
        updates.category_id = category_id || null;
    if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) {
            (0, response_1.sendError)(res, 'Name cannot be empty', 400);
            return;
        }
        updates.name = trimmedName;
    }
    if (description !== undefined)
        updates.description = String(description).trim() || null;
    if (price !== undefined) {
        const parsedPrice = parsePriceField(price);
        if (parsedPrice === null) {
            (0, response_1.sendError)(res, 'Price must be a valid number 0 or greater', 400);
            return;
        }
        updates.price = parsedPrice;
    }
    if (image_url !== undefined)
        updates.image_url = image_url;
    if (stock !== undefined) {
        const parsedStock = parseStockField(stock);
        if (parsedStock === null) {
            (0, response_1.sendError)(res, 'Stock must be a whole number 0 or greater', 400);
            return;
        }
        updates.stock = parsedStock;
    }
    if (is_available !== undefined) {
        const parsedAvailability = parseBooleanField(is_available);
        if (parsedAvailability === undefined) {
            (0, response_1.sendError)(res, 'is_available must be true or false', 400);
            return;
        }
        updates.is_available = parsedAvailability;
    }
    const { data, error } = await supabase_1.supabase
        .from('items')
        .update(updates)
        .eq('id', req.params.id)
        .select('*, categories(id, name, description)')
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
