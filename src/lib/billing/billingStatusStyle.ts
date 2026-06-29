type StatusColors = {
  backgroundColor: string;
  color: string;
};

const STATUS_COLORS: Record<string, StatusColors> = {
  completed: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' },
  active: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' },
  pending: { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#EAB308' },
  incomplete: { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#EAB308' },
  failed: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
  refunded: { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' },
  canceled: { backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' },
  past_due: { backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#F97316' },
};

export function getBillingStatusColors(status: string): StatusColors {
  return STATUS_COLORS[status] ?? STATUS_COLORS.pending;
}
