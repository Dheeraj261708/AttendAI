export default function Input({ label, error, ...props }) {
  return <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700">{label}</label><input {...props} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${error?'border-red-400':'border-slate-200'} ${props.className||''}`}/>{error && <p className="text-xs font-medium text-red-600">{error}</p>}</div>;
}
