import crypto from 'crypto';

/**
 * Generates a unique, high-entropy application number for record-keeping.
 * Uses Node.js 'crypto' module for secure random bytes.
 *
 * Format: APP-{YYYY}-{8-CHARACTER-HEX}
 * Example: APP-2026-F5A2B9C3
 *
 * @returns {string} The formatted unique application number.
 */
export function generateApplicationNumber() {
  const currentYear = new Date().getFullYear();

  // Generate 4 random bytes which converts to an 8-character uppercase hex string.
  // This provides sufficient uniqueness for the application pool.
  const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `APP-${currentYear}-${entropy}`;
}
