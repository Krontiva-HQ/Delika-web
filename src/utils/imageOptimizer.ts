interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
}

export const optimizeImage = (url: string, options: ImageOptimizationOptions = {}) => {
  const {
    width = 'auto',
    quality = 80,
    format = 'auto'
  } = options;

  // Handle Cloudinary URLs
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_${format}/`);
  }

  // Handle local images from public folder
  if (url.startsWith('/')) {
    // For local images, you might want to use a different optimization strategy
    // One option is to use different sized images for different viewport sizes
    return url;
  }

  return url;
}; 