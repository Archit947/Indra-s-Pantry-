"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.getOrderStats = exports.getMyOrders = exports.placeOrder = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const VALID_STATUSES = [
    'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];
const rollbackStockMutations = async (mutations) => {
    for (const mutation of [...mutations].reverse()) {
        await supabase_1.supabase
            .from('items')
            .update({ stock: mutation.previousStock, updated_at: new Date().toISOString() })
            .eq('id', mutation.itemId)
            .eq('stock', mutation.nextStock);
    }
};
const applyStockMutations = async (mutations) => {
    const applied = [];
    for (const mutation of mutations) {
        const { data, error } = await supabase_1.supabase
            .from('items')
            .update({ stock: mutation.nextStock, updated_at: new Date().toISOString() })
            .eq('id', mutation.itemId)
            .eq('stock', mutation.previousStock)
            .select('id')
            .maybeSingle();
        if (error || !data) {
            await rollbackStockMutations(applied);
            return {
                ok: false,
                message: `Stock changed for ${mutation.itemName}. Please refresh and try again.`,
            };
        }
        applied.push(mutation);
    }
    return { ok: true, applied };
};
const parseOrderItems = (value) => {
    if (!Array.isArray(value))
        return [];
    const parsedItems = [];
    for (const entry of value) {
        const item = entry;
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        if (!item.item_id || !item.name || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(price)) {
            continue;
        }
        parsedItems.push({
            item_id: item.item_id,
            name: item.name,
            price,
            quantity,
            image_url: item.image_url ?? null,
        });
    }
    return parsedItems;
};
const buildRestockMutations = async (orderItems) => {
    const quantitiesByItemId = new Map();
    for (const item of orderItems) {
        const existing = quantitiesByItemId.get(item.item_id);
        if (existing) {
            existing.quantity += item.quantity;
        }
        else {
            quantitiesByItemId.set(item.item_id, { name: item.name, quantity: item.quantity });
        }
    }
    const mutations = [];
    for (const [itemId, snapshot] of quantitiesByItemId.entries()) {
        const { data: currentItem } = await supabase_1.supabase
            .from('items')
            .select('id, name, stock')
            .eq('id', itemId)
            .maybeSingle();
        if (!currentItem)
            continue;
        mutations.push({
            itemId: currentItem.id,
            itemName: currentItem.name ?? snapshot.name,
            previousStock: currentItem.stock ?? 0,
            nextStock: (currentItem.stock ?? 0) + snapshot.quantity,
        });
    }
    return mutations;
};
// POST /api/orders - convert cart to order
const placeOrder = async (req, res) => {
    const userId = req.user.id;
    const { notes, payment_method = 'cash_at_pickup' } = req.body;
    const { data: cartItems, error: cartError } = await supabase_1.supabase
        .from('cart_items')
        .select('*, items(id, name, price, image_url, is_available, stock)')
        .eq('user_id', userId);
    if (cartError || !cartItems || cartItems.length === 0) {
        (0, response_1.sendError)(res, 'Your cart is empty', 400);
        return;
    }
    const typedCartItems = cartItems;
    const invalidItems = typedCartItems.filter((ci) => {
        if (!ci.items)
            return true;
        return !ci.items.is_available || ci.items.stock < ci.quantity;
    });
    if (invalidItems.length > 0) {
        (0, response_1.sendError)(res, `Please update your cart before ordering: ${invalidItems
            .map((item) => {
            if (!item.items)
                return 'Unknown item';
            if (!item.items.is_available)
                return `${item.items.name} is not available`;
            if (item.items.stock <= 0)
                return `${item.items.name} is out of stock`;
            return `Only ${item.items.stock} left for ${item.items.name}`;
        })
            .join(', ')}`, 400);
        return;
    }
    const stockMutations = typedCartItems.map((ci) => ({
        itemId: ci.item_id,
        itemName: ci.items.name,
        previousStock: ci.items.stock,
        nextStock: ci.items.stock - ci.quantity,
    }));
    const stockResult = await applyStockMutations(stockMutations);
    if (!stockResult.ok) {
        (0, response_1.sendError)(res, stockResult.message, 400);
        return;
    }
    const orderItems = typedCartItems.map((ci) => ({
        item_id: ci.item_id,
        name: ci.items.name,
        price: ci.items.price,
        quantity: ci.quantity,
        image_url: ci.items.image_url || null,
    }));
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
        await rollbackStockMutations(stockResult.applied);
        (0, response_1.sendError)(res, 'Failed to place order', 500);
        return;
    }
    await supabase_1.supabase.from('cart_items').delete().eq('user_id', userId);
    (0, response_1.sendSuccess)(res, order, 'Order placed successfully', 201);
};
exports.placeOrder = placeOrder;
// GET /api/orders/my - logged-in user's orders
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
// GET /api/orders/stats [admin]
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
// GET /api/orders [admin]
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
// PATCH /api/orders/:id/status [admin]
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
        (0, response_1.sendError)(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
        return;
    }
    const { data: existingOrder, error: existingOrderError } = await supabase_1.supabase
        .from('orders')
        .select('id, status, items')
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
    let appliedRestockMutations = [];
    if (status === 'cancelled') {
        const restockMutations = await buildRestockMutations(parseOrderItems(existingOrder.items));
        if (restockMutations.length > 0) {
            const restockResult = await applyStockMutations(restockMutations);
            if (!restockResult.ok) {
                (0, response_1.sendError)(res, restockResult.message, 400);
                return;
            }
            appliedRestockMutations = restockResult.applied;
        }
    }
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error || !data) {
        if (appliedRestockMutations.length > 0) {
            await rollbackStockMutations(appliedRestockMutations);
        }
        (0, response_1.sendError)(res, 'Order status update failed', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Order status updated');
};
exports.updateOrderStatus = updateOrderStatus;
