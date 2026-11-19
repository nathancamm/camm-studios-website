import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function GlassFooter({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
      className="site-footer glass-footer liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-32 md:mt-64"
    >{children}</motion.footer>
  );
}
