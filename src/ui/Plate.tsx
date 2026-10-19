import type { ComponentProps } from 'react'
import { Frame } from './Frame'

/** A floating control's surface: a dark navy plate in the game's pale frame, over a light blur of the map. */
export function Plate({ className = '', children, ...rest }: ComponentProps<'div'>) {
  return <div className={`plate ${className}`} {...rest}><Frame />{children}</div>
}
