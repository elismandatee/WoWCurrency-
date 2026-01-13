
import React from 'react';

const PiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" fill="#F0B90B" />
    <text
      x="12"
      y="17"
      fontFamily="serif"
      fontSize="18"
      fill="#fff"
      textAnchor="middle"
    >
      π
    </text>
  </svg>
);

export default PiIcon;
