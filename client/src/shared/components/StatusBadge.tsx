import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  pending: 'warning',
  sent: 'info',
  viewed: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'error',
  cancelled: 'error',
  active: 'success',
  inactive: 'default',
  approved: 'success',
  rejected: 'error',
  accepted: 'success',
  expired: 'error',
  converted: 'success',
};

const variantClassMap: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const resolvedVariant = variant || statusVariantMap[status.toLowerCase()] || 'default';
  const className = variantClassMap[resolvedVariant];

  return (
    <Badge className={className}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  );
};

export default StatusBadge;
