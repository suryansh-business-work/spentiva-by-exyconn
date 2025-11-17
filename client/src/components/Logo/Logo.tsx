import React from 'react';
import { Box } from '@mui/material';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width = 140, height = 40 }) => {
  return (
    <Box
      component="svg"
      width={width}
      height={height}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ display: 'block' }}
    >
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#845c58', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#b7bac3', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Icon - Wallet/Expense Symbol */}
      <g transform="translate(0, 5)">
        {/* Wallet Base */}
        <rect x="2" y="12" width="26" height="18" rx="3" fill="url(#logoGradient)" />
        
        {/* Wallet Flap */}
        <path
          d="M 4 12 Q 4 6 10 6 L 20 6 Q 26 6 26 12"
          fill="url(#logoGradient)"
          opacity="0.7"
        />
        
        {/* Card Detail */}
        <rect x="6" y="18" width="16" height="8" rx="1.5" fill="white" opacity="0.3" />
        
        {/* Coin/Circle accent */}
        <circle cx="22" cy="22" r="4" fill="white" opacity="0.4" />
        <circle cx="22" cy="22" r="2" fill="white" opacity="0.6" />
      </g>

      {/* Text - "expensia" */}
      <text
        x="38"
        y="26"
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="url(#logoGradient)"
        letterSpacing="-0.5"
      >
        expensia
      </text>
    </Box>
  );
};

export default Logo;
