
"use client";
import React, { useState, useEffect } from 'react';

const RainEffect = ({ count = 70 }: { count?: number }) => {
  const [raindrops, setRaindrops] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const newRaindrops = Array.from({ length: count }).map((_, i) => (
      <div
        key={`raindrop-${i}`}
        className="raindrop"
        style={{
          left: `${Math.random() * 100}%`,
          animationDuration: `${0.4 + Math.random() * 0.4}s`, // 0.4s to 0.8s fall time
          animationDelay: `${Math.random() * 3}s`, // Stagger start times
        }}
      />
    ));
    setRaindrops(newRaindrops);
  }, [count]);

  if (raindrops.length === 0) { // Avoid rendering empty container server-side before hydration
      return null;
  }

  return <div className="particle-container" aria-hidden="true">{raindrops}</div>;
};

export default RainEffect;
