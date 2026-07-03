interface StatCardProps {
  value: string | number
  label: string
  accentColor: string
}

export default function StatCard({ value, label, accentColor }: StatCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />
      <div className="px-4 py-3">
        <div className="text-2xl font-bold text-white leading-tight">{value}</div>
        <div className="text-xs text-[#595e69] mt-1">{label}</div>
      </div>
    </div>
  )
}