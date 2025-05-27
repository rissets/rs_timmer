
"use client";
import React, { useState, useEffect } from 'react';

const StarfieldEffect = ({ count = 150 }: { count?: number }) => {
  const [stars, setStars] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }).map((_, i) => {
      const size = 1 + Math.random() * 2; // 1px to 3px
      const initialOpacity = 0.3 + Math.random() * 0.7;
      return (
        <div
          key={`star-${i}`}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            // @ts-ignore: Custom CSS variable
            '--star-opacity-start': `${initialOpacity}`,
            // @ts-ignore: Custom CSS variable
            '--star-opacity-end': `${Math.min(1, initialOpacity + 0.3)}`,
            animationDuration: `${2 + Math.random() * 3}s`, // 2s to 5s twinkle time
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      );
    });
    setStars(newStars);
  }, [count]);

  if (stars.length === 0) {
    return null;
  }

  return <div className="particle-container" aria-hidden="true">{stars}</div>;
};

export default StarfieldEffect;
