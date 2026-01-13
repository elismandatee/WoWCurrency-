import React from 'react';

const BnbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" fill="#F0B90B" />
    <path
      d="M6.2 12l3.3-3.3 2.5 2.5L8.7 14.5l-2.5-2.5zM12 6.2l3.3 3.3-2.5 2.5-3.3-3.3L12 6.2zM12 17.8l-3.3-3.3 2.5-2.5 3.3 3.3-2.5 2.5zM17.8 12l-3.3 3.3-2.5-2.5L15.3 9.5l2.5 2.5zM12 12l1.9-1.9-1.9-1.9-1.9 1.9L12 12z"
      fill="white"
    />
  </svg>
);

export default BnbIcon;
