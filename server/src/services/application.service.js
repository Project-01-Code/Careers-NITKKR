import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { generateApplicationNumber } from '../utils/applicationNumberGenerator.js';
import { APPLICATION_STATUS, HTTP_STATUS } from '../constants.js';
import mongoose from 'mongoose';

/**
 * Snapshot job configuration at time of application
 * Captures job details to preserve them even if job is modified later
 *
 * @param {string} jobId - MongoDB ObjectId of the job to snapshot
 * @returns {Promise<Object>} Job snapshot object
 * @returns {string} return.title - Job title
 * @returns {string} return.jobCode - Job advertisement number
 * @returns {string} return.department - Department name
 * @returns {Array<Object>} return.requiredSections - Section configuration array
 * @returns {Array<Object>} return.customFields - Custom field definitions
 * @throws {ApiError} 404 if job not found
 * @throws {ApiError} 400 if job is not published or deadline passed
 */
export async function snapshotJobConfiguration(jobId) {
  const job = await Job.findById(jobId).populate('department');

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status !== 'published') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Job is not published');
  }

  if (new Date() > new Date(job.applicationEndDate)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Application deadline has passed'
    );
  }

  return {
    title: job.title,
    jobCode: job.advertisementNo,
    department: job.department?.name || 'Unknown',
    requiredSections: job.requiredSections || [],
    customFields: job.customFields || [],
  };
}

/**
 * Create a new application with transaction support
 * Ensures atomic creation of application and user reference update
 *
 * @param {string} userId - MongoDB ObjectId of the user creating application
 * @param {string} jobId - MongoDB ObjectId of the job to apply for
 * @returns {Promise<Object>} Created application document
 * @throws {ApiError} 409 if application already exists for this job
 * @throws {ApiError} 404 if job not found
 * @throws {ApiError} 400 if job is not published or deadline passed
 *
 * @example
 * const app = await createApplication(userId, jobId);
 * console.log(app.applicationNumber); // "APP-2026-A3F2D8E1"
 */
export async function createApplication(userId, jobId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if application already exists
    const existingApp = await Application.findOne({ userId, jobId }).session(
      session
    );
    if (existingApp) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Application already exists for this job'
      );
    }

    // Snapshot job configuration
    const jobSnapshot = await snapshotJobConfiguration(jobId);

    // Generate application number
    const applicationNumber = await generateApplicationNumber();

    // Create application
    const application = new Application({
      applicationNumber,
      userId,
      jobId,
      jobSnapshot,
      status: APPLICATION_STATUS.DRAFT,
      sections: new Map(),
    });

    await application.save({ session });

    // Add to user's applicationIds
    await User.findByIdAndUpdate(
      userId,
      { $push: { applicationIds: application._id } },
      { session }
    );

    await session.commitTransaction();
    return application;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Validate section completeness against configuration
 * Checks if section has required data and PDF uploads
 *
 * @param {Object} section - Section data object
 * @param {Object} section.data - Section form data
 * @param {string} section.pdfUrl - Cloudinary URL of uploaded PDF
 * @param {Object} sectionConfig - Section configuration from job snapshot
 * @param {boolean} sectionConfig.isMandatory - Whether section is required
 * @param {boolean} sectionConfig.requiresPDF - Whether PDF upload is required
 * @returns {Array<{field: string, message: string}>} Array of validation errors (empty if valid)
 *
 * @example
 * const errors = validateSectionCompleteness(section, config);
 * if (errors.length > 0) {
 *   console.log('Validation failed:', errors);
 * }
 */
export function validateSectionCompleteness(section, sectionConfig) {
  const errors = [];

  if (sectionConfig.isMandatory && (!section || !section.data)) {
    errors.push({ field: 'data', message: 'Section data is required' });
  }

  if (sectionConfig.requiresPDF && (!section || !section.pdfUrl)) {
    errors.push({ field: 'pdf', message: 'PDF upload is required' });
  }

  return errors;
}

/**
 * Check all mandatory sections are complete
 * Iterates through all required sections and validates each one
 *
 * @param {Object} application - Application document with sections Map
 * @param {Object} application.jobSnapshot - Snapshotted job configuration
 * @param {Array<Object>} application.jobSnapshot.requiredSections - Section configurations
 * @param {Map} application.sections - Map of section type to section data
 * @returns {Array<{section: string, errors: Array}>} Array of section validation errors
 *
 * @example
 * const errors = checkAllMandatorySections(application);
 * if (errors.length === 0) {
 *   console.log('All mandatory sections complete');
 * }
 */
export function checkAllMandatorySections(application) {
  const errors = [];

  application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
    if (sectionConfig.isMandatory) {
      const section = application.sections.get(sectionConfig.sectionType);
      const sectionErrors = validateSectionCompleteness(section, sectionConfig);

      if (sectionErrors.length > 0) {
        errors.push({
          section: sectionConfig.sectionType,
          errors: sectionErrors,
        });
      }
    }
  });

  return errors;
}

/**
 * Lock application to prevent further edits
 * Sets isLocked flag and records timestamp
 *
 * @param {string} applicationId - MongoDB ObjectId of application to lock
 * @returns {Promise<Object>} Updated application document
 * @throws {ApiError} 404 if application not found
 *
 * @example
 * const lockedApp = await lockApplication(appId);
 * console.log(lockedApp.isLocked); // true
 * console.log(lockedApp.lockedAt); // Date object
 */
export async function lockApplication(applicationId) {
  const application = await Application.findByIdAndUpdate(
    applicationId,
    {
      isLocked: true,
      lockedAt: new Date(),
    },
    { new: true }
  );

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  return application;
}
