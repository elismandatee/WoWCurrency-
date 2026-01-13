import React from 'react';

const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H7.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A3.375 3.375 0 006.375 8.25v2.25c0 .414.336.75.75.75h9.75a.75.75 0 00.75-.75v-2.25A3.375 3.375 0 0012 4.875z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.875v16.125" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.875c-1.036 0-1.875.84-1.875 1.875" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.875c1.036 0 1.875.84 1.875 1.875" />
    </svg>
);

export default GiftIcon;
