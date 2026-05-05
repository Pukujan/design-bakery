import { motion } from 'motion/react';

export function Squiggle({ color = '#FF6B9D', className = '' }) {
  return (
    <motion.svg
      className={className}
      width="100"
      height="20"
      viewBox="0 0 100 20"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      <path
        d="M 0 10 Q 25 0, 50 10 T 100 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

export function Halo({ color = '#FFD93D', className = '' }) {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse
          cx="40"
          cy="40"
          rx="30"
          ry="12"
          fill="none"
          stroke={color}
          strokeWidth="4"
          transform="rotate(-20 40 40)"
        />
      </svg>
    </motion.div>
  );
}

export function SpeechBubble({ text = '!!!', color = '#ffffff', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="px-4 py-2 rounded-2xl border-3 border-black"
        style={{ backgroundColor: color }}
      >
        <p className="font-bold">{text}</p>
      </div>
      <div 
        className="absolute -bottom-2 left-4 w-4 h-4 rotate-45 border-b-3 border-r-3 border-black"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function HandPointer({ color = '#FFD93D', direction = 'right', className = '' }) {
  const rotation = direction === 'right' ? 0 : direction === 'left' ? 180 : direction === 'up' ? -90 : 90;
  
  return (
    <motion.svg
      className={className}
      width="60"
      height="60"
      viewBox="0 0 60 60"
      style={{ transform: `rotate(${rotation}deg)` }}
      animate={{ x: [0, 10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <g>
        {/* Palm */}
        <ellipse cx="25" cy="30" rx="12" ry="18" fill={color} />
        {/* Index finger pointing */}
        <rect x="35" y="26" width="20" height="8" rx="4" fill={color} />
        {/* Thumb */}
        <ellipse cx="22" cy="18" rx="5" ry="8" fill={color} transform="rotate(-30 22 18)" />
      </g>
    </motion.svg>
  );
}

export function Star({ color = '#FF6B9D', size = 40, className = '' }) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      animate={{ rotate: [0, 180, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    >
      <path
        d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z"
        fill={color}
      />
    </motion.svg>
  );
}

export function BlobShape({ color = '#4169E1', size = 200, className = '' }) {
  return (
    <motion.div
      className={`blob-shape ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}
