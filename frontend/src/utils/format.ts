/**
 * Format monetary amount into standardized TZS display.
 * Example: TZS 2,450,000
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency = 'TZS'
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${currency} 0`;
  }
  const num = Number(amount);
  return `${currency} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
