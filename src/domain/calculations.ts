export type Row = globalThis.Record<string, unknown>;
export const SOURCE_AS_OF = '2026-08-13';
export const dateOnly = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return new Date(Date.UTC(1899, 11, 30 + value)).toISOString().slice(0, 10);
  const parsed = new Date(String(value)); return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};
const utc = (value: string) => Date.parse(`${value}T00:00:00Z`);
export const demoToday = () => new Date().toISOString().slice(0, 10);
export const rebaseDate = (value: unknown, today = demoToday()) => {
  const source = dateOnly(value); if (!source) return null;
  return new Date(utc(source) + (utc(today) - utc(SOURCE_AS_OF))).toISOString().slice(0, 10);
};
export const daysBetween = (earlier: string | null, later = demoToday()) => earlier ? Math.round((utc(later) - utc(earlier)) / 86400000) : null;
export const active = (exception: Row) => exception.ActionStatusID !== 'AST-COMPLETE';
export const severityRank = (id: unknown) => id === 'SEV-HIGH' ? 3 : id === 'SEV-MEDIUM' ? 2 : 1;
export const severityName = (id: unknown) => id === 'SEV-HIGH' ? 'High' : id === 'SEV-MEDIUM' ? 'Medium' : 'Low';
export const maxRisk = (items: Row[]) => Math.max(0, ...items.map(x => Number(x.RevenueAtRisk) || 0));
export const primaryException = (items: Row[]) => [...items].sort((a, b) => Number(b.BusinessImpactScore) - Number(a.BusinessImpactScore) || severityRank(b.SeverityID) - severityRank(a.SeverityID) || Number(b.RevenueAtRisk) - Number(a.RevenueAtRisk) || String(a.DueDate).localeCompare(String(b.DueDate)))[0];
export const groupBy = <T extends Row>(rows: T[], key: keyof T | string) => rows.reduce<globalThis.Record<string, T[]>>((groups, row) => { const id = String(row[key]); (groups[id] ||= []).push(row); return groups; }, {});
export const formatMoney = (value: number, compact = false) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 2 : 0 }).format(value);
export const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : '—';
export const label = (value: unknown) => String(value ?? '—').replace(/^EXT-NONE$/, 'Unclassified Issue').replace(/^[A-Z]+-/, '').replaceAll('_', ' ').replace(/\b\w/g, x => x.toUpperCase());
