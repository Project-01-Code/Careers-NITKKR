import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

const UPLOAD_TMP_DIR =
  process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), 'tmp', 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_TMP_DIR)) {
    fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
  }
  return UPLOAD_TMP_DIR;
}

const imageDiskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_TMP_DIR);
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    cb(null, `${unique}-${(file.originalname || 'image').slice(-50)}`);
  },
});

/** Shared Image file filter */
const imageFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Only JPEG (JPG) and PNG images are allowed'
      ),
      false
    );
  }
};

/**
 * Photo upload middleware — accepts JPEG/PNG ≤ 200KB (disk storage for malware scan)
 * Used for: POST /api/v1/applications/:id/sections/photo/image
 */
export const uploadPhoto = multer({
  storage: imageDiskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 200 * 1024, // 200KB
    files: 1,
  },
});

/**
 * Signature upload middleware — accepts JPEG/PNG ≤ 200KB (disk storage for malware scan)
 * Used for: POST /api/v1/applications/:id/sections/signature/image
 */
export const uploadSignature = multer({
  storage: imageDiskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 200 * 1024, // 200KB
    files: 1,
  },
});

/**
 * Route-level dispatcher that selects the correct image multer instance
 * based on the `sectionType` URL parameter.
 *
 * Handles:
 *   POST /api/v1/applications/:id/sections/photo/image
 *   POST /api/v1/applications/:id/sections/signature/image
 *
 * If sectionType is neither 'photo' nor 'signature', the request is passed
 * through unchanged and the controller will reject it.
 */
export const uploadImageBySection = (req, res, next) => {
  if (req.params.sectionType === 'photo') {
    uploadPhoto.single('image')(req, res, next);
  } else if (req.params.sectionType === 'signature') {
    uploadSignature.single('image')(req, res, next);
  } else {
    next();
  }
};