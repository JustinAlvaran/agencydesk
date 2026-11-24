"use client"
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * LoopingCarousel
 * - Shows ONE image at a time
 * - Smooth sliding animations between images
 * - Seamless looping (clones first slide at the end)
 * - Autoplay with configurable interval
 * - Pause on hover (configurable)
 */

interface LoopingCarouselProps {
  images?: string[];
  interval?: number;
  height?: string;
  pauseOnHover?: boolean;
  objectFit?: 'cover' | 'contain';
  className?: string;
  transitionDuration?: number;
  easing?: string;
}

export default function LoopingCarousel({
  images = [],
  interval = 3000,
  height = "h-56",
  pauseOnHover = true,
  objectFit = "cover",
  className = "",
  transitionDuration = 800,
  easing = "cubic-bezier(0.4, 0, 0.2, 1)",
}: LoopingCarouselProps) {
  const length = images.length;
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const hoveringRef = useRef(false);

  // Build slides array with clones for seamless looping
  const slides = length > 1 ? [images[length - 1], ...images, images[0]] : images;
  const startIndex = length > 1 ? 1 : 0;

  // Initialize starting position
  useEffect(() => {
    if (length > 1) {
      setIndex(startIndex);
    }
  }, [length, startIndex]);

  // Advance to next slide
  const next = () => {
    setIndex((prevIndex) => prevIndex + 1);
  };

  // Start autoplay
  useEffect(() => {
    if (length <= 1) return;
    
    if (autoRef.current) clearInterval(autoRef.current);
    
    autoRef.current = setInterval(() => {
      if (pauseOnHover && hoveringRef.current) return;
      next();
    }, interval);

    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
      }
    };
  }, [interval, length, pauseOnHover]);

  // Handle seamless looping
  const handleTransitionEnd = () => {
    if (length <= 1) return;
    
    if (index === slides.length - 1) {
      setIsTransitioning(false);
      setIndex(1);
      setTimeout(() => setIsTransitioning(true), 50);
    }
    else if (index === 0) {
      setIsTransitioning(false);
      setIndex(slides.length - 2);
      setTimeout(() => setIsTransitioning(true), 50);
    }
  };

  // Pause on hover handlers
  const onMouseEnter = () => {
    hoveringRef.current = true;
  };
  
  const onMouseLeave = () => {
    hoveringRef.current = false;
  };

  if (length === 0) return null;

  return (
    <div
      className={`w-full overflow-hidden relative ${height} ${className}`}
      onMouseEnter={pauseOnHover ? onMouseEnter : undefined}
      onMouseLeave={pauseOnHover ? onMouseLeave : undefined}
    >
      {/* Slides container */}
      <div
        onTransitionEnd={handleTransitionEnd}
        className="flex h-full"
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: isTransitioning 
            ? `transform ${transitionDuration}ms ${easing}` 
            : "none",
        }}
      >
        {slides.map((src, i) => (
          <div
            key={`slide-${i}-${src}`}
            className="relative shrink-0 h-full w-full"
          >
            <Image
              src={src}
              alt={`Slide ${i + 1}`}
              fill
              className={`rounded-[30px] object-${objectFit} select-none pointer-events-none`}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              sizes="100vw"
              priority={i === startIndex}
            />
          </div>
        ))}
      </div>
    </div>
  );
}