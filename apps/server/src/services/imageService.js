// apps/server/src/services/imageService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads/products');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

export const uploadImage = async (file) => {
  if (STORAGE_PROVIDER === 'local') {
    return {
      filename: file.filename,
      url: `/uploads/products/${file.filename}`
    };
  }
  // Future S3 provider block goes here
  throw new Error(`Storage provider ${STORAGE_PROVIDER} not implemented`);
};

export const deleteImage = async (filename) => {
  if (STORAGE_PROVIDER === 'local') {
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
  return false;
};

export const getImageUrl = (filename) => {
  if (!filename) return null;
  if (STORAGE_PROVIDER === 'local') {
    // In production, you'd use a full URL like process.env.BASE_URL + /uploads/...
    return `http://localhost:3002/uploads/products/${filename}`;
  }
  return filename; // For cloud, filename might be the full URL
};
