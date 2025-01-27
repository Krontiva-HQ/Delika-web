import { useState, ImgHTMLAttributes } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = '/fallback-image.png',
  ...props
}) => {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? fallback : optimizeImage(src)}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      {...props}
    />
  );
}; 