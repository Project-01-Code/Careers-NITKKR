import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

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
 * Memory storage multer for ALL PDF uploads in the system.
 *
 * Keeps the file buffer in-memory so controllers can run magic-byte
 * checks, malware scanning, and size validation BEFORE deciding whether
 * to upload to Cloudinary.
 *
 * Used for:
 *   POST /api/v1/applications/:id/sections/:sectionType/pdf   (section PDFs)
 *   POST /api/v1/applications/:id/sections/final_documents/pdf
 *   POST /api/v1/notices                                       (notice PDFs)
 *   PATCH /api/v1/notices/:id
 */
export const uploadPDFToMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB outer gate; tighter limits enforced per-section in controller
  },
});
