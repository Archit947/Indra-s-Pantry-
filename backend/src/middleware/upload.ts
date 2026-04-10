import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { sendError } from '../utils/response';

// Store files in memory so we can stream them to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

/**
 * After multer parses the file, upload it to Supabase Storage
 * and inject the public URL as req.body.image_url for the controller.
 */
export const uploadToSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    next();
    return;
  }

  const file = req.file;
  const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const filePath = `items/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    sendError(res, 'Image upload failed: ' + error.message, 500);
    return;
  }

  const { data } = supabase.storage
    .from(env.supabaseStorageBucket)
    .getPublicUrl(filePath);

  req.body.image_url = data.publicUrl;
  next();
};
