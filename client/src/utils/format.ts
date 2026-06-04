export function formatCurrency(v: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
export function formatPercent(v: number, decimals = 1) {
  return `${(v * 100).toFixed(decimals)}%`;
}
export function formatNumber(v: number) {
  return new Intl.NumberFormat('en-US').format(v);
}
export function formatDelta(current: number, prev: number): { value: string; isPositive: boolean; isNA: boolean } {
  if (!prev || prev === 0) return { value: 'N/A', isPositive: true, isNA: true };
  const pct = ((current - prev) / prev) * 100;
  return { value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, isPositive: pct >= 0, isNA: false };
}
export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function formatRelative(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
export function validateHexColor(v: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
