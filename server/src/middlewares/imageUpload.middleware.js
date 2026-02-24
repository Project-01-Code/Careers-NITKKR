import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

/**
 * Multer memory storage configuration for image uploads.
 * We validate before streaming to Cloudinary (same pattern as PDF uploads).
 */
const memoryStorage = multer.memoryStorage();

/** Shared JPEG-only file filter */
const jpegFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Only JPEG (JPG) images are allowed'
      ),
      false
    );
  }
};

/**
 * Photo upload middleware — accepts JPEG ≤ 200KB
 * Used for: POST /api/v1/applications/:id/sections/photo/image
 */
export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: jpegFilter,
  limits: {
    fileSize: 200 * 1024, // 200KB
    files: 1,
  },
});

/**
 * Signature upload middleware — accepts JPEG ≤ 50KB
 * Used for: POST /api/v1/applications/:id/sections/signature/image
 */
export const uploadSignature = multer({
  storage: memoryStorage,
  fileFilter: jpegFilter,
  limits: {
    fileSize: 50 * 1024, // 50KB
    files: 1,
  },
});
