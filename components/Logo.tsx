
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stylized W construction based on user image */}
        {/* Left Arm (Orange) */}
        <rect x="18" y="20" width="14" height="60" rx="7" fill="#F58220" transform="rotate(-20 18 20)" />
        {/* Right Arm (Orange) */}
        <rect x="68" y="20" width="14" height="60" rx="7" fill="#F58220" transform="rotate(20 68 20)" />
        {/* Center V (Blue) */}
        <path d="M35 30 L50 75 L65 30" stroke="#2A74B1" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className="flex font-black text-xl tracking-tighter">
          <span className="text-[#2A74B1]">WoW</span>
          <span className="text-[#F58220]">Currency</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
