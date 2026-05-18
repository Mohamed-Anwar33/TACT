interface Props { label: string; className?: string }
export default function SectionEyebrow({ label, className = "" }: Props) {
  return (
    <span className={`eyebrow ${className}`}>
      <span className="gold-divider" />
      {label}
    </span>
  );
}
