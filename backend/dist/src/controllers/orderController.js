"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.getOrderStats = exports.getMyOrders = exports.placeOrder = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const VALID_STATUSES = [
    'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];
// POST /api/orders  — convert cart to order
const placeOrder = async (req, res) => {
    const userId = req.user.id;
    const { notes, payment_method = 'cash_at_pickup' } = req.body;
    // Fetch user's current cart with item details
    const { data: cartItems, error: cartError } = await supabase_1.supabase
        .from('cart_items')
        .select('*, items(id, name, price, image_url, is_available)')
        .eq('user_id', userId);
    if (cartError || !cartItems || cartItems.length === 0) {
        (0, response_1.sendError)(res, 'Your cart is empty', 400);
        return;
    }
    // Check all items are still available
    const unavailable = cartItems.filter((ci) => !ci.items?.is_available);
    if (unavailable.length > 0) {
        (0, response_1.sendError)(res, `Some items are no longer available: ${unavailable.map((i) => i.items?.name).join(', ')}`, 400);
        return;
    }
    // Build order snapshot (prices captured at order time)
    const orderItems = cartItems.map((ci) => ({
        item_id: ci.item_id,
        name: ci.items.name,
        price: ci.items.price,
        quantity: ci.quantity,
        image_url: ci.items.image_url || null,
    }));
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Insert order
    const { data: order, error: orderError } = await supabase_1.supabase
        .from('orders')
        .insert({
        user_id: userId,
        items: orderItems,
        total_amount: totalAmount,
        status: 'placed',
        payment_method,
        notes: notes?.trim() || null,
    })
        .select()
        .single();
    if (orderError || !order) {
        (0, response_1.sendError)(res, 'Failed to place order', 500);
        return;
    }
    // Clear cart after successful order
    await supabase_1.supabase.from('cart_items').delete().eq('user_id', userId);
    (0, response_1.sendSuccess)(res, order, 'Order placed successfully', 201);
};
exports.placeOrder = placeOrder;
// GET /api/orders/my — logged-in user's orders
const getMyOrders = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch orders', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getMyOrders = getMyOrders;
// GET /api/orders/stats  [admin]
const getOrderStats = async (_req, res) => {
    const { data: orders, error } = await supabase_1.supabase
        .from('orders')
        .select('status, total_amount');
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch stats', 500);
        return;
    }
    const stats = {
        total: orders?.length ?? 0,
        placed: orders?.filter((o) => o.status === 'placed').length ?? 0,
        accepted: orders?.filter((o) => o.status === 'accepted').length ?? 0,
        preparing: orders?.filter((o) => o.status === 'preparing').length ?? 0,
        ready: orders?.filter((o) => o.status === 'ready').length ?? 0,
        completed: orders?.filter((o) => o.status === 'completed').length ?? 0,
        cancelled: orders?.filter((o) => o.status === 'cancelled').length ?? 0,
        totalRevenue: orders?.reduce((s, o) => s + (o.total_amount ?? 0), 0) ?? 0,
    };
    (0, response_1.sendSuccess)(res, stats);
};
exports.getOrderStats = getOrderStats;
// GET /api/orders  [admin]
const getAllOrders = async (req, res) => {
    const { status } = req.query;
    let query = supabase_1.supabase
        .from('orders')
        .select('*, users(id, name, email, phone)')
        .order('created_at', { ascending: false });
    if (status)
        query = query.eq('status', status);
    const { data, error } = await query;
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch orders', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getAllOrders = getAllOrders;
// GET /api/orders/:id
const getOrderById = async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    let query = supabase_1.supabase
        .from('orders')
        .select('*, users(id, name, email, phone)')
        .eq('id', req.params.id);
    // Non-admins can only see their own orders
    if (!isAdmin)
        query = query.eq('user_id', req.user.id);
    const { data, error } = await query.single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Order not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getOrderById = getOrderById;
// PATCH /api/orders/:id/status  [admin]
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
        (0, response_1.sendError)(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
        return;
    }
    const { data: existingOrder, error: existingOrderError } = await supabase_1.supabase
        .from('orders')
        .select('id, status')
        .eq('id', req.params.id)
        .maybeSingle();
    if (existingOrderError || !existingOrder) {
        (0, response_1.sendError)(res, 'Order not found', 404);
        return;
    }
    if (existingOrder.status === 'completed' || existingOrder.status === 'cancelled') {
        (0, response_1.sendError)(res, 'Finalized orders cannot be updated', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Order status update failed', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Order status updated');
};
exports.updateOrderStatus = updateOrderStatus;
