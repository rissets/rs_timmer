
"use client";
import React, { useState, useEffect } from 'react';

const FirefliesEffect = ({ count = 50 }: { count?: number }) => {
  const [fireflies, setFireflies] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const newFireflies = Array.from({ length: count }).map((_, i) => {
      const size = 2 + Math.random() * 3; // 2px to 5px
      const animationDuration = 5 + Math.random() * 10; // 5s to 15s
      const animationDelay = Math.random() * 10; // Stagger start times

      return (
        <div
          key={`firefly-${i}`}
          className="firefly"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
            // @ts-ignore: Custom CSS variables for varied movement
            '--firefly-translateX': `${(Math.random() - 0.5) * 150}px`,
            '--firefly-translateY': `${(Math.random() - 0.5) * 150}px`,
          }}
        />
      );
    });
    setFireflies(newFireflies);
  }, [count]);

  if (fireflies.length === 0) {
    return null;
  }

  return <div className="particle-container" aria-hidden="true">{fireflies}</div>;
};

export default FirefliesEffect;
