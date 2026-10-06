"use client";

import React, { useState, useEffect } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

export interface ImageProps
  extends Omit<React.ComponentProps<"img">, "src" | "alt" | "width" | "height"> {
  src?: string | null;
  alt?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  quality?: number | `${number}`;
  sizes?: string;
  unoptimized?: boolean;
  wrapperClassName?: string;
  skeletonClassName?: string;
  fallbackClassName?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  showFallbackText?: boolean;
  showSkeleton?: boolean;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt = "",
      width,
      height,
      fill = false,
      priority = false,
      quality,
      sizes,
      unoptimized = true,
      className,
      wrapperClassName,
      skeletonClassName,
      fallbackClassName,
      fallbackIcon,
      fallbackText,
      showFallbackText = false,
      showSkeleton = true,
      onLoad,
      onError,
      style,
      ...props
    },
    ref
  ) => {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">(() => {
      return !src ? "error" : "loading";
    });

    useEffect(() => {
      if (!src) {
        setStatus("error");
      } else {
        setStatus("loading");
      }
    }, [src]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus("loaded");
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus("error");
      onError?.(e);
    };

    const renderFallback = () => (
      <div
        data-slot="image-fallback"
        className={cn(
          "flex flex-col items-center justify-center bg-muted/60 text-muted-foreground p-1 text-center select-none",
          fill ? "absolute inset-0" : "w-full h-full min-h-8 min-w-8",
          fallbackClassName
        )}
        title={alt ? `Không thể tải ảnh: ${alt}` : "Không thể tải ảnh"}
      >
        {fallbackIcon ?? (
          <Ban className="w-5 h-5 max-w-[80%] max-h-[80%] stroke-[1.75] text-muted-foreground/70 shrink-0" />
        )}
        {showFallbackText && (
          <span className="text-[10px] mt-1 font-medium text-muted-foreground/80 truncate max-w-full px-1">
            {fallbackText || "Lỗi tải ảnh"}
          </span>
        )}
      </div>
    );

    // CASE 1: fill is true (covers parent container)
    if (fill) {
      return (
        <div
          data-slot="image-wrapper"
          className={cn("relative w-full h-full overflow-hidden", wrapperClassName)}
          style={style}
        >
          {status === "loading" && showSkeleton && (
            <Skeleton
              className={cn(
                "absolute inset-0 w-full h-full rounded-[inherit] z-1",
                skeletonClassName
              )}
            />
          )}

          {status === "error" ? (
            renderFallback()
          ) : (
            <NextImage
              ref={ref}
              src={src!}
              alt={alt}
              fill
              priority={priority}
              quality={quality}
              sizes={sizes}
              unoptimized={unoptimized}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "transition-opacity duration-300",
                status === "loading" ? "opacity-0" : "opacity-100",
                className
              )}
              {...(props as Partial<NextImageProps>)}
            />
          )}
        </div>
      );
    }

    // CASE 2: width and height are provided (NextImage with fixed dimensions)
    if (width !== undefined && height !== undefined) {
      const numWidth = typeof width === "string" ? parseInt(width, 10) : width;
      const numHeight = typeof height === "string" ? parseInt(height, 10) : height;

      return (
        <div
          data-slot="image-wrapper"
          className={cn("relative inline-block overflow-hidden", wrapperClassName)}
          style={{ width: numWidth, height: numHeight, ...style }}
        >
          {status === "loading" && showSkeleton && (
            <Skeleton
              className={cn(
                "absolute inset-0 w-full h-full rounded-[inherit] z-1",
                skeletonClassName
              )}
            />
          )}

          {status === "error" ? (
            renderFallback()
          ) : (
            <NextImage
              ref={ref}
              src={src!}
              alt={alt}
              width={numWidth}
              height={numHeight}
              priority={priority}
              quality={quality}
              unoptimized={unoptimized}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "transition-opacity duration-300",
                status === "loading" ? "opacity-0" : "opacity-100",
                className
              )}
              {...(props as Partial<NextImageProps>)}
            />
          )}
        </div>
      );
    }

    // CASE 3: Neither fill nor width/height provided (styled by className, e.g. w-10 h-10)
    return (
      <div
        data-slot="image-wrapper"
        className={cn("relative overflow-hidden inline-flex", className, wrapperClassName)}
        style={style}
      >
        {status === "loading" && showSkeleton && (
          <Skeleton
            className={cn(
              "absolute inset-0 w-full h-full rounded-[inherit] z-1",
              skeletonClassName
            )}
          />
        )}

        {status === "error" ? (
          renderFallback()
        ) : (
          <img
            ref={ref}
            src={src!}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              status === "loading" ? "opacity-0" : "opacity-100"
            )}
            {...props}
          />
        )}
      </div>
    );
  }
);

Image.displayName = "Image";
