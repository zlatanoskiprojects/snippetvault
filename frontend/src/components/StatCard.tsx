import Card from './ui/Card'

interface StatCardProps {
  value: string | number
  label: string
  accentColor: string
}

export default function StatCard({ value, label, accentColor }: StatCardProps) {
  return (
    <Card accentColor={accentColor} accentClassName="h-[3px]">
      <div className="px-4 py-3">
        <div className="text-2xl font-bold text-primary leading-tight">{value}</div>
        <div className="text-xs text-muted mt-1">{label}</div>
      </div>
    </Card>
  )
}
