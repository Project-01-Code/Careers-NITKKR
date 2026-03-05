import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

const UPLOAD_TMP_DIR =
  process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), 'tmp', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_TMP_DIR)) {
    fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
  }
  return UPLOAD_TMP_DIR;
}

const pdfDiskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_TMP_DIR);
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    cb(null, `${unique}-${(file.originalname || 'file').slice(-50)}`);
  },
});

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
 * Disk storage multer for ALL PDF uploads that require malware scanning.
 * Files are written to tmp/uploads, then scanned, then uploaded to Cloudinary, then temp deleted.
 *
 * Used for:
 *   POST /api/v1/applications/:id/sections/:sectionType/pdf
 *   POST /api/v1/applications/:id/sections/final_documents/pdf
 *   POST /api/v1/notices
 *   PATCH /api/v1/notices/:id
 */
export const uploadPDFToMemory = multer({
  storage: pdfDiskStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
