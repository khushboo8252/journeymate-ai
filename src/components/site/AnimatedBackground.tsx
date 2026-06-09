import { motion } from "framer-motion";

/**
 * AI-inspired animated background:
 *  - Subtle animated grid
 *  - Floating gradient orbs (blurred)
 *  - Drifting particle dots
 * Pure CSS/SVG + framer-motion. No external deps.
 */
export function AnimatedBackground() {
  const particles = Array.from({ length: 22 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {/* Animated grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="ai-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
            />
          </pattern>
          <radialGradient id="ai-grid-mask" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="ai-grid-fade">
            <rect width="100%" height="100%" fill="url(#ai-grid-mask)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#ai-grid)"
          mask="url(#ai-grid-fade)"
        />
      </svg>

      {/* Gradient orbs */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0.5, x: -40, y: -20 }}
        animate={{ opacity: [0.4, 0.7, 0.4], x: [-40, 30, -40], y: [-20, 20, -20] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.58 0.18 255 / 0.35), transparent 70%)" }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0.4, x: 30, y: 30 }}
        animate={{ opacity: [0.3, 0.6, 0.3], x: [30, -40, 30], y: [30, -10, 30] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.13 235 / 0.32), transparent 70%)" }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[20rem] w-[20rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.14 200 / 0.25), transparent 70%)" }}
      />

      {/* Drifting particles */}
      {particles.map((_, i) => {
        const left = (i * 53) % 100;
        const delay = (i % 7) * 0.8;
        const duration = 8 + (i % 5) * 2;
        const size = 2 + (i % 3);
        return (
          <motion.span
            key={i}
            aria-hidden
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 1, 1, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full bg-primary/60"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              boxShadow: "0 0 8px 1px oklch(0.58 0.18 255 / 0.6)",
            }}
          />
        );
      })}

      {/* Scanning beam */}
      <motion.div
        aria-hidden
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 h-full w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.58 0.18 255 / 0.08), transparent)",
        }}
      />
    </div>
  );
}