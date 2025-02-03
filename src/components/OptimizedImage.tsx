import { useState, useEffect } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: 'blur' | 'none';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  placeholder = 'none',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    const optimizedSrc = optimizeImage(src, {
      quality: 60,
      format: 'webp',
      width: props.width ? Number(props.width) : undefined,
      height: props.height ? Number(props.height) : undefined,
    });
    setImageSrc(optimizedSrc);

    // Preload image
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => setLoading(false);
  }, [src, props.width, props.height]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${loading && placeholder === 'blur' ? 'blur-sm' : ''}`}
        {...props}
      />
      {loading && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ backdropFilter: 'blur(8px)' }}
        />
      )}
    </div>
  );
}; 