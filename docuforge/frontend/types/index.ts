export type DocumentType =
  | "email"
  | "cover_letter"
  | "leave_letter"
  | "resignation_letter"
  | "resume"
  | "custom"
  | "memo"
  | "proposal"
  | "agreement"
  | "meeting_minutes"
  | "report";

export type ToneType =
  | "formal"
  | "professional"
  | "friendly"
  | "assertive"
  | "empathetic";

export type LengthType = "short" | "medium" | "long";

export type RefineAction =
  | "regenerate"
  | "shorten"
  | "improve_tone"
  | "make_formal";

// ─── Per-document input shapes ─────────────────────────────────────
export interface EmailInputs {
  fromName: string;
  toName: string;
  subject: string;
  purpose: string;
  tone: ToneType;
  length: LengthType;
}

export interface CoverLetterInputs {
  candidateName: string;
  role: string;
  company: string;
  experienceSummary: string;
  skills: string;
  tone: ToneType;
}

export interface LeaveLetterInputs {
  employeeName: string;
  managerName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface ResignationLetterInputs {
  employeeName: string;
  managerName: string;
  company: string;
  lastWorkingDay: string;
  yearsWorked?: string;
  reason?: string;
}

export interface ResumeInputs {
  name: string;
  email: string;
  phone: string;
  targetRole?: string;
  skills: string;
  experienceSummary: string;
  education: string;
}

export interface CustomDocumentInputs {
  title: string;
  context: string;
  sender?: string;
  recipient?: string;
  tone: ToneType;
}

export interface MemoInputs {
  title: string;
  from: string;
  to: string;
  subject: string;
  context: string;
  tone: ToneType;
}

export interface ProposalInputs {
  title: string;
  clientName: string;
  preparedBy: string;
  projectScope: string;
  deliverables: string;
  timeline: string;
  budget: string;
}

export interface AgreementInputs {
  title: string;
  partyA: string;
  partyB: string;
  effectiveDate: string;
  scope: string;
  terms: string;
  duration: string;
}

export interface MeetingMinutesInputs {
  meetingTitle: string;
  date: string;
  chairedBy: string;
  attendees: string;
  agenda: string;
  discussion: string;
  actionItems: string;
}

export interface ReportInputs {
  title: string;
  preparedBy: string;
  date: string;
  summary: string;
  body: string;
  findings: string;
  recommendations: string;
}

export type AnyDocumentInputs =
  | EmailInputs
  | CoverLetterInputs
  | LeaveLetterInputs
  | ResignationLetterInputs
  | ResumeInputs
  | CustomDocumentInputs
  | MemoInputs
  | ProposalInputs
  | AgreementInputs
  | MeetingMinutesInputs
  | ReportInputs;

// ─── API shapes ────────────────────────────────────────────────────
export interface GeneratedDocResult {
  id: string;
  documentType: DocumentType;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

export interface HistoryItem {
  documentId: string;
  documentType: DocumentType;
  title: string;
  wordCount: number;
  createdAt: string;
}

export interface HistoryItemFull extends HistoryItem {
  content: string;
  inputs: Record<string, unknown>;
}

export interface PersonalizationData {
  preferredTone: ToneType;
  mostUsedDocumentType: DocumentType | null;
  commonNames: string[];
  commonCompanies: string[];
  documentTypeCounts: Record<string, number>;
  lastUsedInputs: Record<string, Record<string, unknown>>;
  suggestedTypes: DocumentType[];
}

// ─── UI constants ──────────────────────────────────────────────────
export interface DocTypeConfig {
  id: DocumentType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Manual Document ────────────────────────────────────────────
export interface ManualDocument {
  id: string;
  title: string;
  content: string;
  format: "html" | "plain";
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

