import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const Sheet = BaseDialog.Root
export function SheetPortal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="sheet-portal" {...props} />
}

const sheetVariants = cva('fixed top-0 z-40 h-dvh max-w-full outline-none transition-transform duration-150', {
  variants: {
    side: {
      left: 'left-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
      right: 'right-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
    },
  },
  defaultVariants: { side: 'right' },
})

export function SheetTrigger({ className, ...props }: ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger data-slot="sheet-trigger" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SheetClose({ className, ...props }: ComponentProps<typeof BaseDialog.Close>) {
  return <BaseDialog.Close data-slot="sheet-close" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title data-slot="sheet-title" className={state => cn('text-sm font-medium text-primary', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SheetDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description data-slot="sheet-description" className={state => cn('text-sm text-secondary', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SheetOverlay({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
  return <BaseDialog.Backdrop data-slot="sheet-overlay" className={state => cn('fixed inset-0 z-40 bg-overlay/50 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SheetContent({ side, className, overlayClassName, ...props }: ComponentProps<typeof BaseDialog.Popup> & VariantProps<typeof sheetVariants> & { overlayClassName?: string }) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <BaseDialog.Popup data-slot="sheet-content" data-side={side ?? 'right'} className={state => cn(sheetVariants({ side }), typeof className === 'function' ? className(state) : className)} {...props} />
    </SheetPortal>
  )
}
