import {
  BadgeCheck,
  EyeOff,
  Fingerprint,
  IdCard,
  KeyRound,
  Lock,
  LockKeyhole,
  ScanFace,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// Deterministic layout so the background is identical on every load and in the video.
const ICONS: { Icon: LucideIcon; top: string; left: string; size: number; opacity: number; duration: number }[] = [
  { Icon: ShieldCheck, top: '12%', left: '6%', size: 56, opacity: 0.07, duration: 11 },
  { Icon: Lock, top: '22%', left: '86%', size: 44, opacity: 0.06, duration: 9 },
  { Icon: Fingerprint, top: '62%', left: '4%', size: 64, opacity: 0.05, duration: 13 },
  { Icon: IdCard, top: '74%', left: '88%', size: 52, opacity: 0.06, duration: 10 },
  { Icon: ScanFace, top: '40%', left: '93%', size: 40, opacity: 0.05, duration: 12 },
  { Icon: KeyRound, top: '86%', left: '20%', size: 40, opacity: 0.055, duration: 8 },
  { Icon: ShieldAlert, top: '6%', left: '58%', size: 38, opacity: 0.05, duration: 14 },
  { Icon: BadgeCheck, top: '50%', left: '14%', size: 34, opacity: 0.045, duration: 9 },
  { Icon: UserCheck, top: '88%', left: '64%', size: 44, opacity: 0.05, duration: 11 },
  { Icon: EyeOff, top: '30%', left: '24%', size: 30, opacity: 0.04, duration: 10 },
  { Icon: Shield, top: '58%', left: '76%', size: 60, opacity: 0.04, duration: 13 },
  { Icon: LockKeyhole, top: '16%', left: '36%', size: 30, opacity: 0.045, duration: 12 },
]

export function FloatingBackground() {
  const reduce = usePrefersReducedMotion()
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {ICONS.map(({ Icon, top, left, size, opacity, duration }, i) => (
        <motion.div
          key={i}
          className="absolute text-white"
          style={{ top, left, opacity }}
          animate={reduce ? undefined : { y: [0, -12, 0, 12, 0], rotate: [0, 6, 0, -6, 0] }}
          transition={reduce ? undefined : { duration, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        >
          <Icon size={size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  )
}
