import type { ComponentProps } from 'react'

export function Plate({ className = '', ...rest }: ComponentProps<'div'>) {
  return <div className={`plate ${className}`} {...rest} />
}
