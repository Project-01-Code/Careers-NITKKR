import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.config.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nit_kkr_careers',
    resource_type: 'raw', // For PDFs
    allowed_formats: ['pdf'],
    public_id: (req, file) => {
      // Generate unique public_id using timestamp
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `notice_${timestamp}_${originalName}`;
    },
  },
});

// File filter to accept only PDFs
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

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
