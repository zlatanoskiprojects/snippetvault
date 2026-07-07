import Badge from './ui/Badge'

interface TagPillProps {
  label: string
}

export default function TagPill({ label }: TagPillProps) {
  return <Badge label={label} bgColor="#242424" textColor="#595e69" />
}
