import React from 'react';
import { ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';

export function SecurityBadge({ classification, size = 'sm' }) {
  const norm = (classification || 'INTERNAL').toUpperCase();

  const styles = {
    PUBLIC: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    INTERNAL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    CONFIDENTIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    HIGHLY_CONFIDENTIAL: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const icons = {
    PUBLIC: <Eye className="w-3 h-3" />,
    INTERNAL: <ShieldCheck className="w-3 h-3" />,
    CONFIDENTIAL: <Lock className="w-3 h-3" />,
    HIGHLY_CONFIDENTIAL: <AlertTriangle className="w-3 h-3 text-rose-400" />,
  };

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium border ${styles[norm] || styles.INTERNAL} ${sizeClass}`}
    >
      {icons[norm] || icons.INTERNAL}
      {norm}
    </span>
  );
}
