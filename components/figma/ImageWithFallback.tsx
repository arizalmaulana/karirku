"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc("https://via.placeholder.com/400x300?text=Image+Not+Available");
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      width={400}
      height={300}
      onError={handleError}
      unoptimized
    />
  );
}

