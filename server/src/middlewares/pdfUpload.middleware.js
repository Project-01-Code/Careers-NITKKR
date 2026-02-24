import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.config.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

// Cloudinary storage — uploads directly to cloud (used for notice PDFs)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nit_kkr_careers',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    public_id: (req, file) => {
      // Include .pdf extension so Cloudinary serves it as PDF (browser preview, not forced download)
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/\.pdf$/i, '');
      return `notice_${timestamp}_${originalName}.pdf`;
    },
  },
});

// File filter — accepts only PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only PDF files are allowed'),
      false
    );
  }
};

// Multer instance with Cloudinary storage (for notice PDF uploads)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
