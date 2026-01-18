const cloudinary = require('cloudinary').v2;
const path = require('path');

// Ensure dotenv is loaded FIRST (in case this file is imported before server.js)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ ERROR: Cloudinary credentials not found in environment variables.');
  console.error('   Current values:');
  console.error(`   CLOUDINARY_CLOUD_NAME: ${cloudName ? '✓' : '✗'}`);
  console.error(`   CLOUDINARY_API_KEY: ${apiKey ? '✓' : '✗'}`);
  console.error(`   CLOUDINARY_API_SECRET: ${apiSecret ? '✓' : '✗'}`);
  console.error('   Please check your .env file in the server directory.');
  console.error('   Image uploads will fail until credentials are configured.');
} else {
  // Configure Cloudinary only when credentials are available
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
  console.log('✓ Cloudinary configured successfully');
}

/**
 * Upload image to Cloudinary from base64 string
 * @param {string} base64Image - Base64 encoded image string (data:image/...)
 * @param {string} folder - Folder name in Cloudinary (optional)
 * @returns {Promise<string>} - URL of uploaded image
 */
async function uploadImage(base64Image, folder = 'bill-images') {
  // Check credentials before attempting upload
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials chưa được cấu hình. Vui lòng kiểm tra file .env');
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      // Optimize image
      transformation: [
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' }  // Auto format (webp when possible)
      ]
    });

    return result.secure_url; // Return secure HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Không thể upload ảnh lên Cloudinary: ' + error.message);
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Full URL of the image to delete
 * @returns {Promise<void>}
 */
async function deleteImage(imageUrl) {
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = urlParts[urlParts.length - 2] + '/' + fileNameWithExtension.split('.')[0];

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error - deletion is not critical
  }
}

module.exports = {
  uploadImage,
  deleteImage
};
