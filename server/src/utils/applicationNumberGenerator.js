import crypto from 'crypto';

/**
 * Generates a unique application number using crypto
 * Format: APP-YYYY-XXXXXXXX (where X is a random hex string)
 * @returns {string} The generated application number
 */
export function generateApplicationNumber() {
    const year = new Date().getFullYear();

    // Generate 4 random bytes and convert to hex (8 characters)
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();

    return `APP-${year}-${randomHex}`;
}
