
import React from 'react';

const EthIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path fill="#627EEA" d="M12 2.6L11.5 3l-7 4.2v8.5l7 4.2l7-4.2V7.2L12.5 3L12 2.6z" />
    <path fill="#4658A1" d="M12 2.6v18.8l7-4.2V7.2L12 2.6z" />
    <path fill="#C0C8F5" d="M12 13.4l-7-4.2l7-2.4v6.6z" />
    <path fill="#8392D5" d="M12 13.4v6.6l7-4.2l-7-2.4z" />
    <path fill="#4658A1" d="M5 9.2l7 4.2v-6.6L5 9.2z" />
    <path fill="#627EEA" d="M12 13.4l7-4.2l-7 2.4v1.8z" />
  </svg>
);

export default EthIcon;
