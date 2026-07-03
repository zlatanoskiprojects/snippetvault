interface TagPillProps {
  label: string
}

export default function TagPill({ label }: TagPillProps) {
  return (
    <span className="bg-[#242424] text-[#595e69] text-[10px] px-2 py-0.5 rounded">
      {label}
    </span>
  )
}