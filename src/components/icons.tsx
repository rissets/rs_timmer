
import type { SVGProps } from 'react';

// Custom SVG "RS" Logo
export const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100" // Adjusted viewBox for better text rendering
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    {...props}
  >
    {/* Transparent rect to enforce viewBox if no size given, not strictly necessary with text */}
    {/* <rect width="100" height="100" fill="transparent" /> */}
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="60" // Adjusted font size
      fontWeight="bold"
      fontFamily="var(--font-geist-sans), Arial, sans-serif" // Use app's font
      stroke="none" // Text should not have an outline by default unless desired
    >
      RS
    </text>
  </svg>
);

// Example of keeping another icon if needed:
/*
import { Focus } from 'lucide-react';
export const AnotherIcon = (props: SVGProps<SVGSVGElement>) => (
  <Focus {...props} />
);
*/
