import React from 'react';

const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 18c-5.965 0-10.816-4.851-10.816-10.816S6.035 1.184 12 1.184s10.816 4.851 10.816 10.816S17.965 21 12 21zm0-18c5.965 0 10.816 4.851 10.816 10.816S17.965 21 12 21" />
  </svg>
);

export default GlobeIcon;