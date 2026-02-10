import { AuditLog } from '../models/auditLog.model.js';

/**
 * Logs an action to the audit/activity log.
 * @param {Object} params - The log parameters.
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.action - The action performed (e.g., 'JOB_CREATED').
 * @param {string} params.resourceType - The type of resource (e.g., 'Job').
 * @param {string} params.resourceId - The ID of the resource.
 * @param {Object} [params.changes] - The changes made (optional).
 * @param {Object} [params.req] - The express request object (optional, for IP/UserAgent).
 */
export const logAction = async ({
    userId,
    action,
    resourceType,
    resourceId,
    changes = {},
    req = null,
}) => {
    try {
        let ipAddress = '';
        let userAgent = '';

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            userAgent = req.headers['user-agent'] || '';
        }

        await AuditLog.create({
            userId,
            action,
            resourceType,
            resourceId,
            changes,
            ipAddress,
            userAgent,
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Silent fail to not disrupt main flow, but should be monitored
    }
};
