import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { JOB_STATUS, AUDIT_ACTIONS, RESOURCE_TYPES } from '../constants.js';
import { logAction } from '../utils/auditLogger.js';
import { deleteFromCloudinary } from './upload.service.js';
import cloudinary from '../config/cloudinary.config.js';

/**
 * Background Task Service
 * Handles scheduled operations like closing expired jobs and cleaning up files.
 */

/**
 * Automatically closes jobs that have passed their end date.
 */
export const closeExpiredJobs = async () => {
    try {
        const now = new Date();

        // Find published jobs where endDate is in the past
        const expiredJobs = await Job.find({
            status: JOB_STATUS.PUBLISHED,
            endDate: { $lt: now }
        });

        if (expiredJobs.length === 0) return;

        console.log(`[CRON] Found ${expiredJobs.length} expired jobs. Closing...`);

        for (const job of expiredJobs) {
            const oldStatus = job.status;
            job.status = JOB_STATUS.CLOSED;
            await job.save();

            // Audit log (minimalistic request object mock for internal tasks)
            await logAction({
                userId: null, // System action
                action: AUDIT_ACTIONS.JOB_CLOSED,
                resourceType: RESOURCE_TYPES.JOB,
                resourceId: job._id,
                req: {
                    ip: '127.0.0.1',
                    headers: { 'user-agent': 'Internal-Cron-Job' }
                },
                changes: {
                    before: { status: oldStatus },
                    after: { status: JOB_STATUS.CLOSED },
                    reason: 'Auto-closed by system (End date reached)'
                }
            });

            console.log(`[CRON] Job ${job.jobCode} auto-closed.`);
        }
    } catch (error) {
        console.error('[CRON ERROR] Failed to close expired jobs:', error);
    }
};

/**
 * Identifies and deletes files in Cloudinary that have no reference in MongoDB.
 * Performance Note: This performs a full scan of the applications/ folder.
 */
export const cleanupOrphanFiles = async () => {
    try {
        console.log('[CRON] Starting Cloudinary orphan cleanup...');

        // 1. Get all cloudinaryIds from applications
        const applications = await Application.find({}, 'sections');
        const dbCloudinaryIds = new Set();

        applications.forEach(app => {
            app.sections.forEach(section => {
                if (section.cloudinaryId) {
                    dbCloudinaryIds.add(section.cloudinaryId);
                }
            });
        });

        // 2. Fetch all resources from Cloudinary folder 'nit_kkr_careers'
        // This is a simplified version; in production with 10k+ files, use cursor-based pagination
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'nit_kkr_careers/',
            max_results: 500
        });

        let deletedCount = 0;
        for (const resource of resources) {
            if (!dbCloudinaryIds.has(resource.public_id)) {
                console.log(`[CRON] Deleting orphan file: ${resource.public_id}`);
                await deleteFromCloudinary(resource.public_id, resource.resource_type);
                deletedCount++;
            }
        }

        console.log(`[CRON] Orphan cleanup completed. Deleted ${deletedCount} files.`);
    } catch (error) {
        console.error('[CRON ERROR] Cloudinary cleanup failed:', error);
    }
};

/**
 * Starts the background worker.
 */
export const startBackgroundWorker = () => {
    console.log('--- Background Worker Started ---');

    // Job expiry: Hourly
    setInterval(closeExpiredJobs, 3600000);

    // Cloudinary cleanup: Daily (86400000 ms)
    setInterval(cleanupOrphanFiles, 86400000);

    // Initial runs
    closeExpiredJobs();
    cleanupOrphanFiles();
};
