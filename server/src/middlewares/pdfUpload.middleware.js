import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB

// File filter —-accepts only PDF MIME type
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only PDF files are allowed'),
      false
    );
  }
};

/**
 * Memory storage multer for ALL PDF uploads.
 * Files are held in RAM as buffers, then uploaded to Cloudinary.
 * No local disk persistence is used.
 */
export const uploadPDFToMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
