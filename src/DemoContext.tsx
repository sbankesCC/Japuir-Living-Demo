import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import source from './data/generated/controlTowerV2.json';

type Row = Record<string, any>;
export type VendorSubmission = { POLineID: string; VendorID: string; NewMilestoneID: string; VendorExpectedCompletionDate: string; VendorReportedStatus: 'On Track' | 'Delayed'; DelayReasonID?: string; Comment?: string };
type DemoState = { poLines: Row[]; vendorUpdates: Row[] };
type Demo = DemoState & { vendors: Row[]; products: Row[]; milestones: Row[]; exceptionTypes: Row[]; asOf: string; signedInVendor: string; resetNonce: number; signIn: (vendorID: string) => void; signOut: () => void; submitVendorUpdate: (input: VendorSubmission) => Row; resetDemo: () => void };

const SESSION_KEY = 'jaipur-living-demo-session-v1';
const VENDOR_KEY = 'jaipur-living-vendor-session-v1';
const data: any = source;
const otherReason = { ExceptionTypeID: 'DR-OTHER', ExceptionTypeName: 'Other', DelayCategory: 'Other', ApplicableStageGroup: 'All', Description: 'Vendor-entered delay reason requiring a comment in the fictional demo.' };
const base: DemoState = { poLines: data.poLines, vendorUpdates: [] };
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000));
const toDate = (value: string) => Date.parse(`${value}T00:00:00Z`);
const initialState = (): DemoState => { try { const stored = sessionStorage.getItem(SESSION_KEY); if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed.poLines) && Array.isArray(parsed.vendorUpdates)) return parsed; } } catch { /* use source data */ } return base; };

function reducer(state: DemoState, action: { type: 'submit'; input: VendorSubmission } | { type: 'reset' }): DemoState {
  if (action.type === 'reset') return base;
  const input = action.input; const old = state.poLines.find(x => x.POLineID === input.POLineID); if (!old) return state;
  const milestones = [...data.milestoneDefinitions].sort((a: Row, b: Row) => a.StepNumber - b.StepNumber); const next = milestones.find((x: Row) => x.MilestoneID === input.NewMilestoneID); const oldStep = milestones.find((x: Row) => x.MilestoneID === old.CurrentMilestoneID)?.StepNumber || 1;
  if (!next || next.StepNumber < oldStep || next.StepNumber > 6) return state;
  const asOf = data.meta.sourceAsOfDate; const advanced = next.MilestoneID !== old.CurrentMilestoneID; const milestoneStart = advanced ? asOf : old.MilestoneStartDate; const daysAtMilestone = daysBetween(milestoneStart, asOf);
  const projectedETA = addDays(input.VendorExpectedCompletionDate, milestones.filter((x: Row) => x.StepNumber > next.StepNumber && x.StepNumber <= 12).reduce((total: number, x: Row) => total + Number(x.TargetDays || 0), 0));
  const etaVariance = Math.max(0, daysBetween(old.PlannedETA, projectedETA)); const milestoneVariance = Math.max(0, daysAtMilestone - Number(next.TargetDays || 0)); const variance = Math.max(etaVariance, milestoneVariance); const delayed = input.VendorReportedStatus === 'Delayed' || variance > 0; const riskPct = delayed ? (variance >= 8 ? .6 : variance >= 4 ? .35 : .15) : 0;
  const potentialRevenue = Number(old.Quantity) * Number(old.UnitRevenue); const revenueAtRisk = Math.round(potentialRevenue * riskPct * 100) / 100; const priority = delayed && (variance >= 8 || revenueAtRisk >= 50000 || 0 >= 4) ? 'High' : delayed ? 'Medium' : 'None';
  const updated = { ...old, CurrentMilestoneID: next.MilestoneID, MilestoneStartDate: milestoneStart, TargetDays: next.TargetDays, DaysAtMilestone: daysAtMilestone, VendorDelayFlag: delayed ? 'Yes' : 'No', DelayReasonID: delayed ? input.DelayReasonID || null : null, VendorExpectedCompletionDate: input.VendorExpectedCompletionDate, VendorComment: input.Comment || '', CurrentETA: projectedETA, ETAVarianceDays: etaVariance, MilestoneVarianceDays: milestoneVariance, ScheduleVarianceDays: variance, ScheduleStatus: delayed ? 'Delayed' : 'On Track', LastVendorUpdateDate: asOf, DaysSinceVendorUpdate: 0, MilestoneUpdateCadenceDays: next.UpdateCadenceDays, NextUpdateDueDate: addDays(asOf, Number(next.UpdateCadenceDays || 0)), UpdateDueFlag: 'No', UpdateDueSoonFlag: 'No', DaysUpdateOverdue: 0, RevenueRiskPct: riskPct, PotentialRevenue: potentialRevenue, RevenueAtRisk: revenueAtRisk, AtRiskFlag: delayed ? 'Yes' : 'No', Priority: priority, RecommendedActionID: delayed ? (priority === 'High' ? 'ACT-ESCALATE-VENDOR' : 'ACT-REQUEST-REVISED-COMPLETION') : 'ACT-NO-ACTION', RecommendationReason: delayed ? `Delayed ${variance || 'vendor reported'} ${variance ? 'days' : ''}`.trim() : 'No action required', RecommendationEvidence: delayed ? [`Delayed ${variance || 'vendor reported'} ${variance ? 'days' : ''}`.trim()] : [] };
  const event = { VendorUpdateID: `VUP-${String(state.vendorUpdates.length + 1).padStart(3, '0')}`, POLineID: old.POLineID, VendorID: old.VendorID, SubmittedAt: new Date().toISOString(), PreviousMilestoneID: old.CurrentMilestoneID, NewMilestoneID: next.MilestoneID, VendorExpectedCompletionDate: input.VendorExpectedCompletionDate, VendorReportedStatus: input.VendorReportedStatus, DelayReasonID: updated.DelayReasonID, Comment: input.Comment || '', ProjectedETA: projectedETA };
  return { poLines: state.poLines.map(x => x.POLineID === old.POLineID ? updated : x), vendorUpdates: [...state.vendorUpdates, event] };
}

const DemoContext = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState); const [signedInVendor, setSignedInVendor] = useState(() => sessionStorage.getItem(VENDOR_KEY) || ''); const [resetNonce, setResetNonce] = useState(0);
  useEffect(() => { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); }, [state]);
  const resetDemo = () => { dispatch({ type: 'reset' }); sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(VENDOR_KEY); setSignedInVendor(''); setResetNonce(x => x + 1); };
  const signIn = (vendorID: string) => { sessionStorage.setItem(VENDOR_KEY, vendorID); setSignedInVendor(vendorID); };
  const signOut = () => { sessionStorage.removeItem(VENDOR_KEY); setSignedInVendor(''); };
  const submitVendorUpdate = (input: VendorSubmission) => { const before = state.vendorUpdates.length; dispatch({ type: 'submit', input }); return { submittedAt: new Date().toISOString(), eventIndex: before + 1 }; };
  return <DemoContext.Provider value={{ ...state, vendors: data.vendors, products: data.products, milestones: data.milestoneDefinitions, exceptionTypes: [...data.exceptionTypes, otherReason], asOf: data.meta.sourceAsOfDate, signedInVendor, resetNonce, signIn, signOut, submitVendorUpdate, resetDemo }}>{children}</DemoContext.Provider>;
}
export function useDemo() { const value = useContext(DemoContext); if (!value) throw new Error('DemoProvider is required'); return value; }
export const formatDemoDate = (value?: string) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : '—';
export const isNewerThan = (timestamp: string, date: string) => new Date(timestamp).getTime() > toDate(date);
