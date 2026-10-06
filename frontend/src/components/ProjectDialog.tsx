import { useState } from 'react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Field from './ui/Field'

export interface ProjectDialogInitialData {
  name?: string | null
  description?: string | null
}

export interface ProjectDialogSubmitData {
  name: string
  description: string | null
}

interface ProjectDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ProjectDialogSubmitData) => void
  initialData?: ProjectDialogInitialData | null
}

export default function ProjectDialog({ open, onClose, onSubmit, initialData }: ProjectDialogProps) {
  const isEditing = Boolean(initialData)
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [nameError, setNameError] = useState('')
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName(initialData?.name ?? '')
      setDescription(initialData?.description ?? '')
      setNameError('')
    }
  }

  function handleSubmit() {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    onSubmit({ name: name.trim(), description: description.trim() || null })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => { if (!next) onClose() }}
      title={isEditing ? 'Edit project' : 'New project'}
    >
      <div className="flex flex-col gap-4 px-6 py-5">
        <Field label="Name" error={nameError}>
          <Input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (nameError) setNameError('')
            }}
            placeholder="e.g. React Hooks"
            invalid={Boolean(nameError)}
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description..."
          />
        </Field>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto">
            {isEditing ? 'Save changes' : 'Create project'}
          </Button>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
