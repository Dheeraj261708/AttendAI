import { motion } from 'framer-motion';

export default function Button({ children, type='button', onClick, loading=false, variant='primary', className='' }) {
  const styles = {
    primary:'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary:'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger:'bg-red-600 text-white hover:bg-red-700',
    ghost:'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return <motion.button whileHover={{y:-1}} whileTap={{scale:.98}} type={type} onClick={onClick} disabled={loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}>{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>}{loading ? 'Please wait...' : children}</motion.button>;
}
