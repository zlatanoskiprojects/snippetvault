import type { ReactNode } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const badgeVariants = cva('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium', {
  variants: {
    variant: {
      default: 'bg-tag text-muted',
      secondary: 'bg-surface text-secondary',
      accent: 'bg-accent-badge text-accent',
      danger: 'bg-danger-subtle text-danger',
      outline: 'border border-border-default text-secondary',
    },
  },
  defaultVariants: { variant: 'default' },
})

const textColors: Record<string, string> = {
  'var(--color-muted)': 'text-muted',
  'var(--color-secondary)': 'text-secondary',
  'var(--color-accent)': 'text-accent',
  'var(--color-language-ts)': 'text-language-ts',
  'var(--color-language-py)': 'text-language-py',
  'var(--color-language-sh)': 'text-language-sh',
  'var(--color-language-sql)': 'text-language-sql',
  'var(--color-language-js)': 'text-language-js',
  'var(--color-language-java)': 'text-language-java',
  'var(--color-language-cpp)': 'text-language-cpp',
  'var(--color-language-go)': 'text-language-go',
  'var(--color-language-rust)': 'text-language-rust',
}

const backgroundColors: Record<string, string> = {
  'var(--color-tag)': 'bg-tag',
  'var(--color-control)': 'bg-control',
  'var(--color-surface)': 'bg-surface',
  'var(--color-accent-badge)': 'bg-accent-badge',
  'var(--color-language-ts-surface)': 'bg-language-ts-surface',
  'var(--color-language-py-surface)': 'bg-language-py-surface',
  'var(--color-language-sh-surface)': 'bg-language-sh-surface',
  'var(--color-language-sql-surface)': 'bg-language-sql-surface',
  'var(--color-language-js-surface)': 'bg-language-js-surface',
  'var(--color-language-java-surface)': 'bg-language-java-surface',
  'var(--color-language-cpp-surface)': 'bg-language-cpp-surface',
  'var(--color-language-go-surface)': 'bg-language-go-surface',
  'var(--color-language-rust-surface)': 'bg-language-rust-surface',
}

export interface BadgeProps extends useRender.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  label?: ReactNode
  dotColor?: string
  textColor?: string
  bgColor?: string
}

export function Badge({ label, children, dotColor, textColor, bgColor, className, variant, render, ref, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    state: { slot: 'badge', variant: variant ?? 'default' },
    props: {
      ...props,
      className: cn(badgeVariants({ variant }), bgColor && backgroundColors[bgColor], textColor && textColors[textColor], className),
      children: <>
        {dotColor && <span data-slot="badge-dot" aria-hidden="true" className={cn('size-1.5 rounded-sm shrink-0 bg-current', textColors[dotColor])} />}
        {label ?? children}
      </>,
    },
  })
}

export default Badge
