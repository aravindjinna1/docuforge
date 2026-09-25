import type { DocTypeConfig, DocumentType, ToneType } from "@/types";

export const DOC_TYPES: DocTypeConfig[] = [
  {
    id: "email",
    label: "Business Email",
    shortLabel: "Email",
    description: "Professional emails for any business purpose",
    icon: "✉",
    accentColor: "#6366F1",
    gradientFrom: "#4F46E5",
    gradientTo: "#7C3AED",
  },
  {
    id: "cover_letter",
    label: "Cover Letter",
    shortLabel: "Cover Letter",
    description: "Job application letters that get interviews",
    icon: "📋",
    accentColor: "#0EA5E9",
    gradientFrom: "#0284C7",
    gradientTo: "#0369A1",
  },
  {
    id: "leave_letter",
    label: "Leave Request",
    shortLabel: "Leave Letter",
    description: "Formal leave applications for any type of leave",
    icon: "📅",
    accentColor: "#10B981",
    gradientFrom: "#059669",
    gradientTo: "#047857",
  },
  {
    id: "resignation_letter",
    label: "Resignation Letter",
    shortLabel: "Resignation",
    description: "Exit gracefully and preserve relationships",
    icon: "🤝",
    accentColor: "#F59E0B",
    gradientFrom: "#D97706",
    gradientTo: "#B45309",
  },
  {
    id: "resume",
    label: "Resume / CV",
    shortLabel: "Resume",
    description: "Structured resume content optimized for ATS",
    icon: "👤",
    accentColor: "#EC4899",
    gradientFrom: "#DB2777",
    gradientTo: "#BE185D",
  },
  {
    id: "custom",
    label: "Custom Document",
    shortLabel: "Custom",
    description: "Any formal document, tailored to your needs",
    icon: "✍",
    accentColor: "#8B5CF6",
    gradientFrom: "#7C3AED",
    gradientTo: "#6D28D9",
  },
  {
    id: "memo",
    label: "Internal Memo",
    shortLabel: "Memo",
    description: "Official internal communications for teams and staff",
    icon: "📝",
    accentColor: "#F97316",
    gradientFrom: "#EA580C",
    gradientTo: "#C2410C",
  },
  {
    id: "proposal",
    label: "Business Proposal",
    shortLabel: "Proposal",
    description: "Persuasive proposals for clients and stakeholders",
    icon: "💼",
    accentColor: "#14B8A6",
    gradientFrom: "#0D9488",
    gradientTo: "#0F766E",
  },
  {
    id: "agreement",
    label: "Agreement / MOU",
    shortLabel: "Agreement",
    description: "Formal agreements, NDAs, and memoranda of understanding",
    icon: "🤝",
    accentColor: "#8B5CF6",
    gradientFrom: "#7C3AED",
    gradientTo: "#6D28D9",
  },
  {
    id: "meeting_minutes",
    label: "Meeting Minutes",
    shortLabel: "Minutes",
    description: "Structured notes and action items from meetings",
    icon: "📊",
    accentColor: "#06B6D4",
    gradientFrom: "#0891B2",
    gradientTo: "#0E7490",
  },
  {
    id: "report",
    label: "Business Report",
    shortLabel: "Report",
    description: "Data-driven reports with findings and recommendations",
    icon: "📈",
    accentColor: "#22C55E",
    gradientFrom: "#16A34A",
    gradientTo: "#15803D",
  },
];

export const DOC_TYPE_MAP = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, d])
) as Record<DocumentType, DocTypeConfig>;

export const TONE_OPTIONS: { value: ToneType; label: string; hint: string }[] = [
  { value: "formal", label: "Formal", hint: "Structured and traditional" },
  { value: "professional", label: "Professional", hint: "Business-standard" },
  { value: "friendly", label: "Friendly", hint: "Warm yet professional" },
  { value: "assertive", label: "Assertive", hint: "Direct and confident" },
  { value: "empathetic", label: "Empathetic", hint: "Sensitive and understanding" },
];

export const LENGTH_OPTIONS = [
  { value: "short", label: "Short", hint: "3–5 sentences" },
  { value: "medium", label: "Medium", hint: "2–3 paragraphs" },
  { value: "long", label: "Long", hint: "4+ paragraphs" },
];

export const LEAVE_TYPE_OPTIONS = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Bereavement Leave",
  "Study Leave",
  "Unpaid Leave",
  "Compensatory Leave",
];

