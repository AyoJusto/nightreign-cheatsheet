import { useEffect } from 'react'
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react'

export function Count({ value }: { value: number }) {
  const spring = useSpring(value, { visualDuration: 0.45, bounce: 0.2 })
  const text = useTransform(spring, (v) => Math.round(v).toString())
  // MotionConfig does not reach useSpring; with reduced motion the number changes in place.
  const reduce = useReducedMotion()
  useEffect(() => (reduce ? spring.jump(value) : spring.set(value)), [spring, value, reduce])
  return <motion.span className="num" aria-live="polite">{text}</motion.span>
}
