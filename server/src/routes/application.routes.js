import { Router } from 'express';
import {
    createApplication,
    getUserApplications,
    getApplicationById,
    deleteApplication
} from '../controllers/application.controller.js';
import {
    saveSection,
    uploadSectionPDF,
    deleteSectionPDF,
    validateSection
} from '../controllers/applicationSection.controller.js';
import {
    validateAllBeforeSubmission,
    submitApplication,
    withdrawApplication
} from '../controllers/applicationSubmission.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkApplicationOwnership, checkApplicationEditable } from '../middlewares/applicationOwnership.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    createApplicationSchema,
    getApplicationsQuerySchema,
    saveSectionSchema,
    withdrawApplicationSchema
} from '../validators/application.validator.js';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage (for section PDFs with validation)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// All routes require authentication
router.use(verifyJWT);

// Application CRUD routes
router.post('/', validate(createApplicationSchema), createApplication);
router.get('/', validate(getApplicationsQuerySchema), getUserApplications);
router.get('/:id', checkApplicationOwnership, getApplicationById);
router.delete('/:id', checkApplicationOwnership, checkApplicationEditable, deleteApplication);

// Section routes (require ownership and editability)
router.patch('/:id/sections/:sectionType', checkApplicationOwnership, checkApplicationEditable, validate(saveSectionSchema), saveSection);
router.post('/:id/sections/:sectionType/pdf', checkApplicationOwnership, checkApplicationEditable, upload.single('pdf'), uploadSectionPDF);
router.delete('/:id/sections/:sectionType/pdf', checkApplicationOwnership, checkApplicationEditable, deleteSectionPDF);
router.post('/:id/sections/:sectionType/validate', checkApplicationOwnership, validateSection);

// Submission routes
router.post('/:id/validate-all', checkApplicationOwnership, validateAllBeforeSubmission);
router.post('/:id/submit', checkApplicationOwnership, submitApplication);
router.post('/:id/withdraw', checkApplicationOwnership, validate(withdrawApplicationSchema), withdrawApplication);

export default router;
