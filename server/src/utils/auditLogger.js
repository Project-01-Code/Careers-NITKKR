import { AuditLog } from '../models/auditLog.model.js';

/**
 * Audit Logger Utility
 * Non-blocking audit logging - failures never break API calls
 *
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.action - Action being performed (use AUDIT_ACTIONS constants)
 * @param {string} params.resourceType - Type of resource (use RESOURCE_TYPES constants)
 * @param {string} params.resourceId - ID of the resource being acted upon
 * @param {Object} params.changes - Before/after snapshots { before, after }
 * @param {Object} params.req - Express request object
 */
export const logAction = async ({
  userId,
  action,
  resourceType,
  resourceId = null,
  changes = {},
  req,
}) => {
  // Extract IP address (handle proxies)
  const ipAddress =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    'unknown';

  // Extract user agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Create audit log entry
  const auditLog = new AuditLog({
    userId: userId || null, // Handle null userId for failed login attempts
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress,
    userAgent,
    timestamp: new Date(),
  });

  // Fire and forget - non-blocking
  auditLog.save().catch((error) => {
    // Log errors internally
    console.error('[AUDIT LOG ERROR]', {
      error: error.message,
      stack: error.stack,
      userId,
      action,
      resourceType,
      resourceId,
    });
  });
};
