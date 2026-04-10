"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/categories
const getCategories = async (req, res) => {
    const showAll = req.query.all === 'true' && req.user?.role === 'admin';
    let query = supabase_1.supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
    if (!showAll) {
        query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch categories', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getCategories = getCategories;
// GET /api/categories/:id
const getCategoryById = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .select('*')
        .eq('id', req.params.id)
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Category not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getCategoryById = getCategoryById;
// POST /api/categories  [admin]
const createCategory = async (req, res) => {
    const { name, description, image_url } = req.body;
    if (!name?.trim()) {
        (0, response_1.sendError)(res, 'Category name is required', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .insert({ name: name.trim(), description, image_url })
        .select()
        .single();
    if (error) {
        if (error.code === '23505') {
            (0, response_1.sendError)(res, 'Category name already exists', 409);
            return;
        }
        (0, response_1.sendError)(res, 'Failed to create category', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Category created', 201);
};
exports.createCategory = createCategory;
// PUT /api/categories/:id  [admin]
const updateCategory = async (req, res) => {
    const { name, description, image_url, is_active } = req.body;
    const updates = {};
    if (name !== undefined)
        updates.name = name.trim();
    if (description !== undefined)
        updates.description = description;
    if (image_url !== undefined)
        updates.image_url = image_url;
    if (is_active !== undefined)
        updates.is_active = is_active;
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Failed to update category', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Category updated');
};
exports.updateCategory = updateCategory;
// DELETE /api/categories/:id  [admin]
const deleteCategory = async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('categories')
        .delete()
        .eq('id', req.params.id);
    if (error) {
        (0, response_1.sendError)(res, 'Failed to delete category', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 'Category deleted');
};
exports.deleteCategory = deleteCategory;
