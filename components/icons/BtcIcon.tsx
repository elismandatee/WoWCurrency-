
import React from 'react';

const BtcIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" fill="#F7931A" />
    <path
      d="M14.5 7.5h-5l1 3h3.5a1.5 1.5 0 0 1 0 3h-3.5l-1 3h5m-5 -6v6m2.5 -9v1.5m-2.5 6V18"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
);

export default BtcIcon;
