"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCart = exports.clearCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/cart
const getCart = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('cart_items')
        .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
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
    console.log('[addToCart] Request body:', { item_id, quantity, user_id: req.user?.id });
    if (!item_id) {
        (0, response_1.sendError)(res, 'item_id is required', 400);
        return;
    }
    // Verify item exists and is available
    const { data: item } = await supabase_1.supabase
        .from('items')
        .select('id, is_available')
        .eq('id', item_id)
        .maybeSingle();
    console.log('[addToCart] Item lookup result:', { item });
    if (!item) {
        (0, response_1.sendError)(res, 'Item not found', 404);
        return;
    }
    if (!item.is_available) {
        (0, response_1.sendError)(res, 'Item is out of stock', 400);
        return;
    }
    // Check if item already in cart
    const { data: existingItem } = await supabase_1.supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('item_id', item_id)
        .maybeSingle();
    let result;
    if (existingItem) {
        // Update existing cart item
        result = await supabase_1.supabase
            .from('cart_items')
            .update({ quantity: parseInt(String(quantity), 10) })
            .eq('id', existingItem.id)
            .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
            .single();
    }
    else {
        // Insert new cart item
        result = await supabase_1.supabase
            .from('cart_items')
            .insert({ user_id: req.user.id, item_id, quantity: parseInt(String(quantity), 10) })
            .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
            .single();
    }
    const { data, error } = result;
    console.log('[addToCart] Result:', { error, data });
    if (error) {
        console.error('[addToCart] Error:', error);
        (0, response_1.sendError)(res, 'Failed to add to cart', 500);
        return;
    }
    console.log('[addToCart] Success, returning data:', data);
    (0, response_1.sendSuccess)(res, data, 'Added to cart', 201);
};
exports.addToCart = addToCart;
// PUT /api/cart/:id  — update quantity
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || parseInt(String(quantity), 10) < 1) {
        (0, response_1.sendError)(res, 'Quantity must be at least 1', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('cart_items')
        .update({ quantity: parseInt(String(quantity), 10) })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Cart item not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Cart updated');
};
exports.updateCartItem = updateCartItem;
// DELETE /api/cart/clear  — must be registered BEFORE /:id
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
// DELETE /api/cart/:id  — remove single item
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
