
"use client";
import React, { useState, useEffect } from 'react';

const FloatingBubblesEffect = ({ count = 30 }: { count?: number }) => {
  const [bubbles, setBubbles] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: count }).map((_, i) => {
      const size = 10 + Math.random() * 40; // 10px to 50px
      const initialScale = 0.5 + Math.random() * 0.5;
      return (
        <div
          key={`bubble-${i}`}
          className="bubble"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `-${size}px`, // Start from below the screen
            width: `${size}px`,
            height: `${size}px`,
            // @ts-ignore: Custom CSS variables
            '--bubble-drift': `${(Math.random() - 0.5) * 200}px`, // Horizontal drift
            '--bubble-scale-start': `${initialScale}`,
            '--bubble-scale-end': `${initialScale + 0.2 + Math.random() * 0.3}`,
            '--bubble-opacity-start': `${0.1 + Math.random() * 0.2}`,
            '--bubble-opacity-mid': `${0.3 + Math.random() * 0.4}`,
            animationDuration: `${8 + Math.random() * 12}s`, // 8s to 20s float time
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      );
    });
    setBubbles(newBubbles);
  }, [count]);

  if (bubbles.length === 0) {
    return null;
  }

  return <div className="particle-container" aria-hidden="true">{bubbles}</div>;
};

export default FloatingBubblesEffect;
