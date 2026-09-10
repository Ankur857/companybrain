import React from 'react';
import { Shield, Lock, Eye, AlertCircle } from 'lucide-react';

export function SecurityBadge({ classification, size = 'sm' }) {
  const norm = (classification || 'INTERNAL').toUpperCase();

  const config = {
    PUBLIC: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Eye,
      label: 'PUBLIC',
    },
    INTERNAL: {
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      icon: Shield,
      label: 'INTERNAL',
    },
    CONFIDENTIAL: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Lock,
      label: 'CONFIDENTIAL',
    },
    HIGHLY_CONFIDENTIAL: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: AlertCircle,
      label: 'RESTRICTED',
    },
  };

  const style = config[norm] || config.INTERNAL;
  const Icon = style.icon;
  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border tracking-wide uppercase font-mono ${style.bg} ${sizeClass}`}
    >
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{style.label}</span>
    </span>
  );
}
