import React, { useState } from 'react';
import { Code2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-600 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-300 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Code2 className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <p className="text-sm font-medium max-w-xs">{fallbackTitle || alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
};
