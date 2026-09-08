export default function Card({
  children,
  className = "",
  ...props
}) {
  return (
    <div
      {...props}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}