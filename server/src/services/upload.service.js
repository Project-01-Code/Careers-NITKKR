import { v2 as cloudinary } from 'cloudinary';

/**
 * File Upload Service
 * Handles Cloudinary file operations
 * Note: File uploads are handled by multer-storage-cloudinary middleware
 */

/**
 * Delete file from Cloudinary
 * Errors are logged but don't fail the operation
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image', 'video', 'raw')
 * @returns {Promise<void>}
 */
export const deleteFile = async (publicId, resourceType = 'raw') => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('[FILE CLEANUP] Failed to delete file:', error.message);
  }
};
