import cloudinary from '../config/cloudinary.config.js';

/**
 * Upload Service — centralizes all Cloudinary read/write operations.
 *
 * All controllers stream files through this service after validation.
 * No controller should call cloudinary.uploader directly.
 */

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer          - Raw file buffer from multer memoryStorage.
 * @param {Object} options         - Cloudinary upload options.
 * @param {string} options.publicId - Full public_id (including folder path).
 * @param {string} [options.resourceType='raw'] - 'raw', 'image', or 'video'.
 * @param {string} [options.format] - Force output format (e.g. 'pdf', 'jpg').
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = (buffer, options) => {
  const { publicId, resourceType = 'raw', format } = options;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        ...(format && { format }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by its public ID.
 * Errors are logged but do not throw — deletion failures
 * should never block the user-facing operation.
 *
 * @param {string} publicId      - Cloudinary public ID of the file to delete.
 * @param {string} [resourceType='raw'] - Resource type ('image', 'raw', 'video').
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error(
      '[Cloudinary] Failed to delete file:',
      publicId,
      error.message
    );
  }
};
