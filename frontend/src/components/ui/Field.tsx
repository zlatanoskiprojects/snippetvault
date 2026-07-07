import { useId, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { cn } from '../../lib/utils'

export interface FieldProps {
  label: ReactNode
  error?: string
  hint?: ReactNode
  className?: string
  children: ReactElement<{ id?: string }>
}

export default function Field({ label, error, hint, className, children }: FieldProps) {
  const generatedId = useId()
  const existingId = isValidElement(children) ? children.props.id : undefined
  const controlId = existingId ?? generatedId
  const control = isValidElement(children) ? cloneElement(children, { id: controlId }) : children

  return (
    <BaseField.Root invalid={Boolean(error)} className={cn('flex flex-col gap-1.5', className)}>
      <BaseField.Label htmlFor={controlId} className="text-xs text-[#9ba3af] font-normal">
        {label}
      </BaseField.Label>
      {control}
      {error ? (
        <BaseField.Error match className="text-[11px] text-[#ef4444]">
          {error}
        </BaseField.Error>
      ) : hint ? (
        <span className="text-[11px] text-[#595e69]">{hint}</span>
      ) : null}
    </BaseField.Root>
  )
}
