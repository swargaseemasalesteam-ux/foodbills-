import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  let bg = 'bg-amber-50 text-amber-700 border-amber-200';
  let Icon = Clock;

  if (status === 'Approved') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  } else if (status === 'Rejected') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = XCircle;
  }

  const iconSize = size === 'sm' ? 12 : 14;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${bg}`}>
      <Icon size={iconSize} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
