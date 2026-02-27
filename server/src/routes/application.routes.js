import { Router } from 'express';
import {
  createApplication,
  getUserApplications,
  getApplicationById,
  deleteApplication,
} from '../controllers/application.controller.js';
import {
  saveSection,
  uploadSectionPDF,
  deleteSectionPDF,
  validateSection,
  uploadPhotoOrSignature,
  deletePhotoOrSignature,
  uploadFinalDocuments,
  getCreditPointsSummary,
} from '../controllers/applicationSection.controller.js';
import {
  validateAllBeforeSubmission,
  submitApplication,
  withdrawApplication,
  downloadReceipt,
} from '../controllers/applicationSubmission.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  checkApplicationOwnership,
  checkApplicationEditable,
} from '../middlewares/applicationOwnership.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createApplicationSchema,
  getApplicationsQuerySchema,
  saveSectionSchema,
  withdrawApplicationSchema,
  sectionTypeParamSchema,
} from '../validators/application.validator.js';
import {
  uploadPhoto,
  uploadSignature,
} from '../middlewares/imageUpload.middleware.js';
import multer from 'multer';

const router = Router();

// Memory storage multer for section PDFs (≤ 10MB) and final documents (≤ 3MB — enforced in controller)
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

// All routes require authentication
router.use(verifyJWT);

// Application CRUD
router.post('/', validate(createApplicationSchema), createApplication);
router.get('/', validate(getApplicationsQuerySchema), getUserApplications);
router.get('/:id', checkApplicationOwnership, getApplicationById);
router.delete(
  '/:id',
  checkApplicationOwnership,
  checkApplicationEditable,
  deleteApplication
);

// Standard Section: Save Data (all text/array sections)
router.patch(
  '/:id/sections/:sectionType',
  checkApplicationOwnership,
  checkApplicationEditable,
  validate(saveSectionSchema),
  saveSection
);

// Section: Validate individual section
router.post(
  '/:id/sections/:sectionType/validate',
  checkApplicationOwnership,
  validate(sectionTypeParamSchema),
  validateSection
);

// Section PDFs (certificates, proof, etc.)
router.post(
  '/:id/sections/:sectionType/pdf',
  checkApplicationOwnership,
  checkApplicationEditable,
  validate(sectionTypeParamSchema),
  pdfUpload.single('pdf'),
  uploadSectionPDF
);
router.delete(
  '/:id/sections/:sectionType/pdf',
  checkApplicationOwnership,
  checkApplicationEditable,
  validate(sectionTypeParamSchema),
  deleteSectionPDF
);

// Image Uploads (Photo / Signature)
router.post(
  '/:id/sections/:sectionType/image',
  checkApplicationOwnership,
  checkApplicationEditable,
  (req, res, next) => {
    if (req.params.sectionType === 'photo') {
      uploadPhoto.single('image')(req, res, next);
    } else if (req.params.sectionType === 'signature') {
      uploadSignature.single('image')(req, res, next);
    } else {
      next();
    }
  },
  uploadPhotoOrSignature
);

router.delete(
  '/:id/sections/:sectionType/image',
  checkApplicationOwnership,
  checkApplicationEditable,
  deletePhotoOrSignature
);

// Final Documents (merged PDF ≤ 3MB)
router.post(
  '/:id/sections/final_documents/pdf',
  checkApplicationOwnership,
  checkApplicationEditable,
  pdfUpload.single('pdf'),
  uploadFinalDocuments
);

// Credit Points Summary (auto-calc from saved sections)
router.get(
  '/:id/sections/credit_points/summary',
  checkApplicationOwnership,
  getCreditPointsSummary
);

// Submission Routes
router.post(
  '/:id/validate-all',
  checkApplicationOwnership,
  validateAllBeforeSubmission
);
router.post('/:id/submit', checkApplicationOwnership, submitApplication);
router.post(
  '/:id/withdraw',
  checkApplicationOwnership,
  validate(withdrawApplicationSchema),
  withdrawApplication
);

// Receipt Download (submitted applications only)
router.get('/:id/receipt', checkApplicationOwnership, downloadReceipt);

export default router;
