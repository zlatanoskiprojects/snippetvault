import { useId, cloneElement, type ReactElement, type ReactNode } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { cn } from '../../lib/utils'
import { inputBase } from './Input'

export function FieldRoot({ className, ...props }: BaseField.Root.Props) {
  return <BaseField.Root data-slot="field" className={state => cn('flex flex-col gap-1.5', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function FieldLabel({ className, ...props }: BaseField.Label.Props) {
  return <BaseField.Label data-slot="field-label" className={state => cn('text-xs text-secondary font-normal', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function FieldControl({ className, ...props }: BaseField.Control.Props) {
  return <BaseField.Control data-slot="field-control" className={state => cn(inputBase, typeof className === 'function' ? className(state) : className)} {...props} />
}

export function FieldDescription({ className, ...props }: BaseField.Description.Props) {
  return <BaseField.Description data-slot="field-description" className={state => cn('text-[11px] text-muted', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function FieldError({ className, ...props }: BaseField.Error.Props) {
  return <BaseField.Error data-slot="field-error" className={state => cn('text-[11px] text-danger', typeof className === 'function' ? className(state) : className)} {...props} />
}

export interface FieldProps extends Omit<BaseField.Root.Props, 'children'> {
  label: ReactNode
  error?: string
  hint?: ReactNode
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' }>
}

export function Field({ label, error, hint, children, invalid = Boolean(error) || undefined, ...props }: FieldProps) {
  const generatedId = useId()
  const controlId = children.props.id ?? generatedId
  const descriptionId = error ? `${controlId}-error` : hint ? `${controlId}-description` : undefined
  const control = cloneElement(children, {
    id: controlId,
    'aria-describedby': [children.props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': invalid || children.props['aria-invalid'],
  })

  return (
    <FieldRoot invalid={invalid} {...props}>
      <FieldLabel htmlFor={controlId}>
        {label}
      </FieldLabel>
      {control}
      {error ? (
        <FieldError id={descriptionId} match>
          {error}
        </FieldError>
      ) : hint ? (
        <FieldDescription id={descriptionId}>{hint}</FieldDescription>
      ) : null}
    </FieldRoot>
  )
}

export default Field
