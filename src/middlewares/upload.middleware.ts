import multer from 'multer';
import { Request } from 'express';
import { ApiError } from './error.middleware';

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

// File filter function to validate uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow GeoJSON files
  if (file.fieldname === 'geojson' || file.mimetype === 'application/json' || file.originalname.endsWith('.geojson')) {
    return cb(null, true);
  }
  
  // Allow image files (for pictograms)
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  // Reject other file types
  cb(new ApiError(400, 'Unsupported file type') as unknown as Error);
};

// Size limits in bytes
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size
};

// Create multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// Middleware for batch file uploads (multiple files)
export const batchUpload = upload.array('files', 50); // Max 50 files at once 