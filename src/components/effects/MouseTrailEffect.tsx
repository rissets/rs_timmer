
"use client";

import React, { useEffect, useCallback } from 'react';

const MouseTrailEffect: React.FC = () => {
  const createParticle = useCallback((x: number, y: number) => {
    const particle = document.createElement('div');
    particle.className = 'mouse-trail-particle';
    const size = Math.random() * 5 + 5; // 5px to 10px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 700); // Matches animation duration
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      createParticle(event.clientX, event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Clean up any remaining particles if component unmounts unexpectedly
      document.querySelectorAll('.mouse-trail-particle').forEach(p => p.remove());
    };
  }, [createParticle]);

  return null; // This component only adds an effect, doesn't render anything itself
};

export default MouseTrailEffect;
