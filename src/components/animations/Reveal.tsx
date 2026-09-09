import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { getDeviceProfile } from '@/lib/device';

interface RevealProps {
  children: ReactNode;
  /** Retraso en segundos */
  delay?: number;
  /** Distancia inicial en px */
  y?: number;
  className?: string;
  once?: boolean;
}

const build = (y: number, delay: number): Variants => ({
  hidden: { opacity: 0, y },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
  },
});

/**
 * Reveal 2D simple para UI de DOM (títulos, párrafos, tarjetas).
 * Para animaciones ligadas al scroll de la escena 3D usar GSAP/ScrollTrigger.
 * Respeta `prefers-reduced-motion`.
 */
export function Reveal({ children, delay = 0, y = 28, className, once = true }: RevealProps) {
  const { prefersReducedMotion } = getDeviceProfile();
  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={build(y, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.35 }}
    >
      {children}
    </motion.div>
  );
}
