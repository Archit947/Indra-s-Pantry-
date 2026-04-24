"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCart = exports.clearCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const CART_ITEM_SELECT = '*, items(id, name, price, image_url, is_available, stock, categories(id, name))';
const parseQuantity = (value) => {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed < 1)
        return null;
    return parsed;
};
// GET /api/cart
const getCart = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('cart_items')
        .select(CART_ITEM_SELECT)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: true });
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch cart', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getCart = getCart;
// POST /api/cart
const addToCart = async (req, res) => {
    const { item_id, quantity = 1 } = req.body;
    const parsedQuantity = parseQuantity(quantity);
    if (!item_id) {
        (0, response_1.sendError)(res, 'item_id is required', 400);
        return;
    }
    if (parsedQuantity === null) {
        (0, response_1.sendError)(res, 'Quantity must be at least 1', 400);
        return;
    }
    const { data: item } = await supabase_1.supabase
        .from('items')
        .select('id, name, is_available, stock')
        .eq('id', item_id)
        .maybeSingle();
    if (!item) {
        (0, response_1.sendError)(res, 'Item not found', 404);
        return;
    }
    if (!item.is_available) {
        (0, response_1.sendError)(res, 'Item is not available right now', 400);
        return;
    }
    if (item.stock <= 0) {
        (0, response_1.sendError)(res, 'Item is out of stock', 400);
        return;
    }
    const { data: existingItem } = await supabase_1.supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', req.user.id)
        .eq('item_id', item_id)
        .maybeSingle();
    const finalQuantity = existingItem
        ? existingItem.quantity + parsedQuantity
        : parsedQuantity;
    if (finalQuantity > item.stock) {
        (0, response_1.sendError)(res, `Only ${item.stock} ${item.stock === 1 ? 'item is' : 'items are'} available for ${item.name}`, 400);
        return;
    }
    const result = existingItem
        ? await supabase_1.supabase
            .from('cart_items')
            .update({ quantity: finalQuantity })
            .eq('id', existingItem.id)
            .select(CART_ITEM_SELECT)
            .single()
        : await supabase_1.supabase
            .from('cart_items')
            .insert({ user_id: req.user.id, item_id, quantity: finalQuantity })
            .select(CART_ITEM_SELECT)
            .single();
    const { data, error } = result;
    if (error) {
        (0, response_1.sendError)(res, 'Failed to add to cart', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Added to cart', 201);
};
exports.addToCart = addToCart;
// PUT /api/cart/:id
const updateCartItem = async (req, res) => {
    const parsedQuantity = parseQuantity(req.body.quantity);
    if (parsedQuantity === null) {
        (0, response_1.sendError)(res, 'Quantity must be at least 1', 400);
        return;
    }
    const { data: existingItem, error: existingError } = await supabase_1.supabase
        .from('cart_items')
        .select('id, item_id, items(id, name, is_available, stock)')
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .maybeSingle();
    if (existingError || !existingItem) {
        (0, response_1.sendError)(res, 'Cart item not found', 404);
        return;
    }
    const item = Array.isArray(existingItem.items)
        ? existingItem.items[0]
        : existingItem.items;
    if (!item) {
        (0, response_1.sendError)(res, 'This item is no longer available', 400);
        return;
    }
    if (!item.is_available) {
        (0, response_1.sendError)(res, 'This item is not available right now', 400);
        return;
    }
    if (item.stock <= 0) {
        (0, response_1.sendError)(res, 'This item is out of stock', 400);
        return;
    }
    if (parsedQuantity > item.stock) {
        (0, response_1.sendError)(res, `Only ${item.stock} ${item.stock === 1 ? 'item is' : 'items are'} available for ${item.name}`, 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('cart_items')
        .update({ quantity: parsedQuantity })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select(CART_ITEM_SELECT)
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Cart item not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Cart updated');
};
exports.updateCartItem = updateCartItem;
// DELETE /api/cart/clear - must be registered BEFORE /:id
const clearCart = async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('cart_items')
        .delete()
        .eq('user_id', req.user.id);
    if (error) {
        (0, response_1.sendError)(res, 'Failed to clear cart', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 'Cart cleared');
};
exports.clearCart = clearCart;
// DELETE /api/cart/:id
const removeFromCart = async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('cart_items')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
    if (error) {
        (0, response_1.sendError)(res, 'Failed to remove item', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 'Item removed from cart');
};
exports.removeFromCart = removeFromCart;
