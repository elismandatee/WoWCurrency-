
import React from 'react';

const NgnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#008751"/>
        <path d="M7 16V8h3l2 4 2-4h3v8h-2.5V9.5l-2 4.5h-1l-2-4.5V16H7Z" fill="#fff"/>
        <path d="M6 11h12M6 13h12" stroke="#fff" strokeWidth="1.5"/>
    </svg>
);

export default NgnIcon;
