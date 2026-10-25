import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react'
import { countSpring } from './motion'

export function Count({ value, phrase }: { value: number; phrase: string }) {
  const spring = useSpring(value, countSpring)
  const between = useRef({ low: value, high: value })
  const text = useTransform(spring, (v) => {
    const { low, high } = between.current
    return Math.round(Math.min(high, Math.max(low, v))).toString()
  })
  // MotionConfig does not reach useSpring.
  const reduce = useReducedMotion()
  useEffect(() => {
    const from = Number(text.get())
    between.current = { low: Math.min(from, value), high: Math.max(from, value) }
    if (reduce) spring.jump(value)
    else spring.set(value)
  }, [spring, text, value, reduce])
  return (
    <>
      <motion.span className="num" aria-hidden>{text}</motion.span>
      <span className="sr-only" aria-live="polite">{phrase}</span>
    </>
  )
}
