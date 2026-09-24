import type { ComponentProps } from 'react'

export function Glass({ className = '', style, ...rest }: ComponentProps<'div'>) {
  return <div className={`glass ${className}`} style={{ borderRadius: 'var(--radius-capsule)', ...style }} {...rest} />
}
