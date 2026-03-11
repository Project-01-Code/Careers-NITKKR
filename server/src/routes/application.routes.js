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
import { uploadImageBySection } from '../middlewares/imageUpload.middleware.js';
import { uploadPDFToMemory } from '../middlewares/pdfUpload.middleware.js';
import { malwareScan } from '../middlewares/malwareScan.middleware.js';

const router = Router();

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
  uploadPDFToMemory.single('pdf'),
  malwareScan,
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
  uploadImageBySection,
  malwareScan,
  uploadPhotoOrSignature
);

router.delete(
  '/:id/sections/:sectionType/image',
  checkApplicationOwnership,
  checkApplicationEditable,
  deletePhotoOrSignature
);

// Final Documents (merged PDF ≤ 10MB — enforced in controller after magic-byte check)
router.post(
  '/:id/sections/final_documents/pdf',
  checkApplicationOwnership,
  checkApplicationEditable,
  uploadPDFToMemory.single('pdf'),
  malwareScan,
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
