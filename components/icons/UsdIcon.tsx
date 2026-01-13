
import React from 'react';

const UsdIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#4A88C7"/>
        <path d="M12 6v12M14.5 7.5a2 2 0 0 0-4 0v2a2 2 0 0 1-4 0M9.5 16.5a2 2 0 0 0 4 0v-2a2 2 0 0 1 4 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default UsdIcon;
