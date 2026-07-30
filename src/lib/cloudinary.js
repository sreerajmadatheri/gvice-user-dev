/**
 * Cloudinary Helper Utility for GviceWebsite
 * Handles image uploading to Cloudinary and generating optimized image URLs.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ufiktey7';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gvice_unsigned';

/**
 * Upload an image file directly from the browser to Cloudinary
 * @param {File} file - The file object from file input
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded image
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'gvice/user_uploads');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Transforms a Cloudinary URL to add width, height, and auto quality optimization
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options e.g. { width: 600, height: 400, crop: 'fill' }
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  
  const { width = 800, quality = 'auto', format = 'auto' } = options;
  const transformations = `f_${format},q_${quality},w_${width}`;
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}
