/**
 * The blade: a katana arc and its glowing motion trail, nothing holding it.
 * It sweeps once, fast and decisive, and the world tears where it passes.
 */
export function BladeArc() {
  return (
    <div className="db-blade" aria-hidden="true">
      <svg viewBox="0 0 1200 200" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="db-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff7a3c" stopOpacity="0" />
            <stop offset="35%" stopColor="#ff9a4e" stopOpacity="0.22" />
            <stop offset="78%" stopColor="#ffd08a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff6e2" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="db-trail2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffe9c4" stopOpacity="0" />
            <stop offset="60%" stopColor="#ffe9c4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="db-steel" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8fa4c8" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#dfe9f8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          <filter id="db-blur" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="db-blur-soft" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* wide heat left in the air */}
        <path
          d="M40 178 C 320 150, 660 112, 1150 52"
          fill="none"
          stroke="url(#db-trail)"
          strokeWidth="54"
          strokeLinecap="round"
          filter="url(#db-blur)"
        />
        {/* the body of the cut */}
        <path
          d="M70 172 C 340 146, 670 108, 1152 50"
          fill="none"
          stroke="url(#db-trail)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#db-blur-soft)"
        />
        {/* the hairline of light */}
        <path
          d="M110 166 C 360 142, 680 104, 1156 48"
          fill="none"
          stroke="url(#db-trail2)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* the blade itself, riding the end of the arc */}
        <g transform="translate(1156 48) rotate(-14)">
          <path
            d="M0 0 C -34 -3, -86 -8, -128 -13 C -134 -14, -134 -19, -128 -20 C -84 -22, -32 -14, 2 -7 Z"
            fill="url(#db-steel)"
          />
          <path
            d="M0 -4 C -40 -8, -92 -14, -128 -18"
            fill="none"
            stroke="#fffdf6"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* ember rim along the back */}
          <path
            d="M2 -7 C -32 -14, -84 -22, -128 -20"
            fill="none"
            stroke="#ff9a4e"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
      </svg>
    </div>
  );
}
