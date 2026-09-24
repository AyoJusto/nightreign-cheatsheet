import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'

export function Count({ value }: { value: number }) {
  const spring = useSpring(value, { visualDuration: 0.45, bounce: 0.2 })
  const text = useTransform(spring, (v) => Math.round(v).toString())
  useEffect(() => spring.set(value), [spring, value])
  return <motion.span className="num" aria-live="polite">{text}</motion.span>
}
