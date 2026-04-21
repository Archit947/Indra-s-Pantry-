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

interface SupabaseUploadOptions {
  folder: string;
  bodyField?: string;
}

const normalizeFolder = (folder: string): string =>
  folder
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '') || 'items';

/**
 * Factory middleware:
 * 1) uploads req.file to Supabase Storage under the provided folder
 * 2) writes public URL into req.body[bodyField]
 */
export const createSupabaseUploadMiddleware = ({
  folder,
  bodyField = 'image_url',
}: SupabaseUploadOptions) => {
  const normalizedFolder = normalizeFolder(folder);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      next();
      return;
    }

    const file = req.file;
    const safeName =
      file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '') || 'upload-file';
    const filePath = `${normalizedFolder}/${Date.now()}-${safeName}`;

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

    (req.body as Record<string, unknown>)[bodyField] = data.publicUrl;
    next();
  };
};

// Backward-compatible default uploader used by item routes.
export const uploadToSupabase = createSupabaseUploadMiddleware({
  folder: 'items',
  bodyField: 'image_url',
});
