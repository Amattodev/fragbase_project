"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  fallback,
  width,
  height,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback: React.ReactNode;
  width?: number;
  height?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const showImg = Boolean(src) && loaded && !error;
  return (
    <span className={cn("relative inline-block", className)}>
      {!showImg ? fallback : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(showImg ? "block" : "hidden", imgClassName)}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : null}
    </span>
  );
}

