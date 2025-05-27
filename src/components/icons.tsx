
import type { SVGProps } from 'react';

export const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="currentColor" // Uses the current text color, so it adapts to themes
    {...props}
  >
    <rect width="100" height="100" rx="20" fill="transparent" /> 
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="50"
      fontWeight="bold"
      dy=".05em" // Small adjustment for vertical centering
    >
      RS
    </text>
  </svg>
);

// Example of a custom SVG icon if needed:
/*
export const MyCustomIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2 L2 7 L12 12 L22 7 Z" />
    <path d="M2 17 L12 22 L22 17" />
    <path d="M2 12 L12 17 L22 12" />
  </svg>
);
*/
