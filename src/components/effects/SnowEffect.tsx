
"use client";
import React, { useState, useEffect } from 'react';

const SnowEffect = ({ count = 80 }: { count?: number }) => { // Increased count from 60 to 80
  const [snowflakes, setSnowflakes] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const newSnowflakes = Array.from({ length: count }).map((_, i) => {
      const size = 3 + Math.random() * 5; // 3px to 8px
      return (
        <div
          key={`snowflake-${i}`}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${8 + Math.random() * 12}s`, // 8s to 20s fall time
            animationDelay: `${Math.random() * 15}s`, // Stagger start times over 15s
            opacity: `${0.5 + Math.random() * 0.5}`, // Vary initial opacity for depth, though animation also handles it
            // @ts-ignore: Custom CSS variable for varied drift
            '--snow-drift': `${(Math.random() - 0.5) * 100}px`, // Random drift between -50px and 50px
          }}
        />
      );
    });
    setSnowflakes(newSnowflakes);
  }, [count]);

  if (snowflakes.length === 0) { // Avoid rendering empty container server-side before hydration
      return null;
  }

  return <div className="particle-container" aria-hidden="true">{snowflakes}</div>;
};

export default SnowEffect;

    