"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { DOC_TYPE_MAP } from "@/lib/constants";
import type { DocumentType } from "@/types";

interface Template {
  id: string;
  docType: DocumentType;
  label: string;
  description: string;
  tags: string[];
  preview: string;
}

const TEMPLATES: Template[] = [
  // ── Email ────────────────────────────────────────────────────
  {
    id: "cold-outreach",
    docType: "email",
    label: "Sales Outreach",
    description: "Concise cold outreach email that leads with value, not a pitch.",
    tags: ["Sales", "Cold email", "B2B"],
    preview:
      "Hi [Name], I noticed [Company] recently [achievement]. We've helped similar companies [result]. Worth a 15-minute call?",
  },
  {
    id: "meeting-followup",
    docType: "email",
    label: "Post-Meeting Follow-up",
    description: "Summary of action items and next steps after a business meeting.",
    tags: ["Follow-up", "Internal", "Client"],
    preview:
      "Thank you for your time today. Per our discussion, here are the agreed next steps and owners…",
  },
  {
    id: "client-proposal-email",
    docType: "email",
    label: "Proposal Delivery",
    description: "Professional email to deliver a proposal or quote to a prospective client.",
    tags: ["Proposal", "Sales", "Client"],
    preview:
      "Dear [Name], Following our discussion on [date], I'm pleased to attach our proposal for [project]. The document outlines our approach, timeline, and investment required.",
  },

  // ── Cover Letter ──────────────────────────────────────────────
  {
    id: "promotion-cover-letter",
    docType: "cover_letter",
    label: "Senior Role Application",
    description: "For candidates moving from mid-level into a senior IC or leadership role.",
    tags: ["Career growth", "Senior", "Leadership"],
    preview:
      "With 5+ years driving [function] at [company type], I bring both the technical depth and cross-functional influence your [Role] requires…",
  },
  {
    id: "career-change-cover",
    docType: "cover_letter",
    label: "Career Change Letter",
    description:
      "Reframes transferable skills to justify a pivot into a new industry.",
    tags: ["Career change", "Pivot", "Transferable skills"],
    preview:
      "While my background is in [field A], the core competencies I've developed — [skills] — translate directly to the challenges your [Role] will face…",
  },
  {
    id: "internship-cover",
    docType: "cover_letter",
    label: "Internship / Graduate Application",
    description: "Entry-level cover letter focused on potential, education, and enthusiasm.",
    tags: ["Entry-level", "Graduate", "Internship"],
    preview:
      "As a recent graduate in [field] from [university], I am eager to apply my academic knowledge and hands-on project experience to the [Role] position at [Company].",
  },

  // ── Leave Letter ──────────────────────────────────────────────
  {
    id: "annual-leave",
    docType: "leave_letter",
    label: "Annual Leave Request",
    description:
      "Standard annual leave application with dates, coverage plan, and assurance.",
    tags: ["Annual", "Planned", "PTO"],
    preview:
      "I am writing to formally request annual leave from [date] to [date] inclusive…",
  },
  {
    id: "medical-leave",
    docType: "leave_letter",
    label: "Medical Leave",
    description: "Sensitive medical leave request — professional without oversharing.",
    tags: ["Medical", "Sick leave", "Sensitive"],
    preview:
      "I am writing to request medical leave beginning [date]. I have been advised by my physician to rest for [duration]…",
  },
  {
    id: "family-emergency-leave",
    docType: "leave_letter",
    label: "Emergency / Family Leave",
    description: "Urgent leave request for family emergencies or unexpected situations.",
    tags: ["Emergency", "Family", "Urgent"],
    preview:
      "I am writing to request emergency leave effective immediately due to an unforeseen family matter requiring my urgent attention.",
  },

  // ── Resignation Letter ─────────────────────────────────────────
  {
    id: "graceful-resignation",
    docType: "resignation_letter",
    label: "Graceful Resignation",
    description: "Warm, professional resignation that preserves the relationship.",
    tags: ["Resignation", "Professional", "Relationship-first"],
    preview:
      "It is with mixed emotions that I submit my resignation. My time at [Company] has been genuinely rewarding…",
  },
  {
    id: "retirement-letter",
    docType: "resignation_letter",
    label: "Retirement Announcement",
    description: "Dignified retirement letter expressing gratitude and transition plans.",
    tags: ["Retirement", "Transition", "Gratitude"],
    preview:
      "After [X] years of meaningful work at [Company], I have decided to retire effective [date]. It has been an honor to contribute to this organization's success.",
  },
  {
    id: "immediate-resignation",
    docType: "resignation_letter",
    label: "Short Notice Resignation",
    description: "Professional resignation when leaving on short notice or during probation.",
    tags: ["Short notice", "Probation", "Urgent"],
    preview:
      "Please accept this letter as formal resignation from my position as [Role]. Due to personal circumstances, I regret that my last day will be [date].",
  },

  // ── Resume ─────────────────────────────────────────────────────
  {
    id: "software-resume",
    docType: "resume",
    label: "Software Engineer Resume",
    description: "Achievement-focused resume content for engineers at any level.",
    tags: ["Engineering", "ATS", "Technical"],
    preview:
      "PROFESSIONAL SUMMARY\nResults-driven software engineer with [X] years of experience building scalable distributed systems…",
  },
  {
    id: "marketing-resume",
    docType: "resume",
    label: "Marketing Professional Resume",
    description: "Impact-driven resume for marketing, brand, and growth professionals.",
    tags: ["Marketing", "Growth", "Creative"],
    preview:
      "PROFESSIONAL SUMMARY\nStrategic marketing leader with a track record of driving double-digit revenue growth through data-informed campaigns and brand positioning.",
  },
  {
    id: "executive-resume",
    docType: "resume",
    label: "Executive / C-Suite Resume",
    description: "High-level resume emphasizing leadership, vision, and business impact.",
    tags: ["Executive", "Leadership", "C-Suite"],
    preview:
      "PROFESSIONAL SUMMARY\nTransformational executive with 15+ years of experience scaling technology businesses from $10M to $200M+ in revenue.",
  },

  // ── Custom ─────────────────────────────────────────────────────
  {
    id: "policy-memo",
    docType: "custom",
    label: "Internal Policy Memo",
    description:
      "Clear, authoritative internal memo communicating a new policy or procedure.",
    tags: ["Internal", "Policy", "All-staff"],
    preview:
      "MEMORANDUM\nTo: All Staff\nFrom: [Department]\nRe: [Policy Name]\n\nEffective [date], the following policy applies to all employees…",
  },

  // ── Memo ──────────────────────────────────────────────────────
  {
    id: "policy-change-memo",
    docType: "memo",
    label: "Policy Change Announcement",
    description: "Official memo announcing a change in company policy or procedure.",
    tags: ["Policy", "Announcement", "HR"],
    preview:
      "MEMORANDUM\nTO: All Employees\nFROM: HR Department\nDATE: [Date]\nSUBJECT: Updated Remote Work Policy\n\nEffective [date], the following policy changes will take effect regarding flexible work arrangements.",
  },
  {
    id: "project-status-memo",
    docType: "memo",
    label: "Project Status Update",
    description: "Status memo providing a project update to stakeholders and teams.",
    tags: ["Project", "Status", "Internal"],
    preview:
      "MEMORANDUM\nTO: Project Team\nFROM: [Project Lead]\nSUBJECT: Q2 Project Status Update\n\nThis memo provides an update on the current status of our key initiatives, milestones achieved, and upcoming deadlines.",
  },
  {
    id: "team-announcement-memo",
    docType: "memo",
    label: "Team Announcement",
    description: "Welcome a new team member, celebrate a promotion, or share team news.",
    tags: ["Team", "Announcement", "Welcome"],
    preview:
      "MEMORANDUM\nTO: [Department]\nFROM: [Manager]\nSUBJECT: Welcome to Our New Team Member\n\nI am pleased to announce that [Name] will be joining our team as [Role] effective [date].",
  },

  // ── Proposal ──────────────────────────────────────────────────
  {
    id: "service-proposal",
    docType: "proposal",
    label: "Consulting Service Proposal",
    description: "Professional services proposal outlining scope, deliverables, and investment.",
    tags: ["Consulting", "Services", "Scope"],
    preview:
      "PROPOSAL: [Project Name]\nPrepared for: [Client]\nPrepared by: [Your Name]\n\nWe are pleased to submit this proposal for [project]. Our approach leverages deep expertise in [domain].",
  },
  {
    id: "project-proposal",
    docType: "proposal",
    label: "Project Initiation Proposal",
    description: "Internal or external proposal to initiate a new project or initiative.",
    tags: ["Project", "Initiation", "Planning"],
    preview:
      "PROJECT PROPOSAL\nTitle: [Project Name]\nSubmitted by: [Department]\n\nThis proposal outlines the business case, scope, timeline, and resources required for [project].",
  },
  {
    id: "sponsorship-proposal",
    docType: "proposal",
    label: "Sponsorship / Partnership Proposal",
    description: "Persuasive proposal seeking sponsorship or strategic partnership.",
    tags: ["Sponsorship", "Partnership", "Business Development"],
    preview:
      "SPONSORSHIP PROPOSAL\nPresented to: [Company]\n\nWe invite you to partner with us on [initiative], offering unique brand visibility to [audience].",
  },

  // ── Agreement ─────────────────────────────────────────────────
  {
    id: "mutual-nda",
    docType: "agreement",
    label: "Mutual Non-Disclosure Agreement",
    description: "Standard mutual NDA for two parties evaluating a business relationship.",
    tags: ["NDA", "Confidentiality", "Legal"],
    preview:
      "MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into on [date] by and between [Party A] and [Party B] regarding the exchange of confidential information.",
  },
  {
    id: "service-agreement",
    docType: "agreement",
    label: "Service Agreement Contract",
    description: "Comprehensive service agreement outlining terms, scope, and payment.",
    tags: ["Services", "Contract", "Terms"],
    preview:
      "SERVICE AGREEMENT\n\nThis Service Agreement is made on [date] between [Client] and [Provider] for the provision of services described herein.",
  },
  {
    id: "partnership-mou",
    docType: "agreement",
    label: "Partnership Memorandum of Understanding",
    description: "Non-binding MOU outlining the framework for a strategic partnership.",
    tags: ["Partnership", "MOU", "Strategic"],
    preview:
      "MEMORANDUM OF UNDERSTANDING\n\nThis MOU is entered into on [date] between [Party A] and [Party B] with the shared objective of collaborating in the area of [domain].",
  },

  // ── Meeting Minutes ───────────────────────────────────────────
  {
    id: "weekly-standup-minutes",
    docType: "meeting_minutes",
    label: "Weekly Standup Notes",
    description: "Concise weekly standup meeting notes with updates and blockers.",
    tags: ["Standup", "Weekly", "Agile"],
    preview:
      "MEETING MINUTES: Weekly Standup\nDate: [Date]\nAttendees: [Names]\n\nUpdates, blockers, and action items from the weekly team standup.",
  },
  {
    id: "client-meeting-minutes",
    docType: "meeting_minutes",
    label: "Client Meeting Summary",
    description: "Professional meeting summary with decisions, feedback, and follow-ups.",
    tags: ["Client", "External", "Follow-up"],
    preview:
      "MEETING MINUTES: Client Meeting — [Project]\nDate: [Date]\nAttendees: [Names]\n\nDiscussion points, client feedback, decisions made, and action items from the client meeting.",
  },
  {
    id: "board-meeting-minutes",
    docType: "meeting_minutes",
    label: "Board Meeting Minutes",
    description: "Formal board meeting minutes with resolutions and voting records.",
    tags: ["Board", "Formal", "Governance"],
    preview:
      "BOARD MEETING MINUTES\nDate: [Date]\nAttendees: [Board Members]\n\nFormal record of the board meeting including agenda items, discussions, resolutions passed, and voting results.",
  },

  // ── Report ────────────────────────────────────────────────────
  {
    id: "weekly-progress-report",
    docType: "report",
    label: "Weekly Progress Report",
    description: "Weekly update report covering accomplishments, metrics, and next steps.",
    tags: ["Weekly", "Progress", "Status"],
    preview:
      "WEEKLY PROGRESS REPORT\nReporting Period: [Date Range]\nPrepared by: [Name]\n\nSummary of accomplishments, key metrics, challenges, and priorities for the upcoming week.",
  },
  {
    id: "incident-report",
    docType: "report",
    label: "Incident / Post-Mortem Report",
    description: "Detailed incident analysis with root cause, impact, and remediation steps.",
    tags: ["Incident", "Post-mortem", "Technical"],
    preview:
      "INCIDENT REPORT\nIncident: [Title]\nDate: [Date]\nSeverity: [Level]\n\nDetailed analysis of the incident including timeline, root cause, impact assessment, and remediation measures implemented.",
  },
  {
    id: "end-of-year-report",
    docType: "report",
    label: "End-of-Year Summary Report",
    description: "Comprehensive annual summary with KPIs, achievements, and strategic recommendations.",
    tags: ["Annual", "Summary", "KPIs"],
    preview:
      "END-OF-YEAR REPORT [Year]\nPrepared by: [Name/Department]\n\nAnnual performance review including key achievements, financial results, challenges, and strategic recommendations for the coming year.",
  },
];

export default function TemplatesPage() {
  const grouped = TEMPLATES.reduce<Partial<Record<DocumentType, Template[]>>>(
    (acc, t) => {
      if (!acc[t.docType]) acc[t.docType] = [];
      acc[t.docType]!.push(t);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Templates
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Quick-start templates for common scenarios. Select one to use it as the starting
          point for your next document.
        </p>
      </div>

      {/* Grouped by document type */}
      {(Object.keys(grouped) as DocumentType[]).map((docType) => {
        const cfg = DOC_TYPE_MAP[docType];
        const templates = grouped[docType] ?? [];

        return (
          <section key={docType}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                }}
              >
                {cfg.icon}
              </div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {cfg.label}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <TemplateCard key={tpl.id} template={tpl} cfg={cfg} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TemplateCard({
  template,
  cfg,
}: {
  template: Template;
  cfg: ReturnType<typeof Object.values<(typeof DOC_TYPE_MAP)[DocumentType]>>[0];
}) {
  return (
    <Link
      href="/generate"
      className="flex flex-col p-4 rounded-xl border transition-all group"
      style={{
        background: "var(--surface-card)",
        borderColor: "var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = cfg.accentColor;
        (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.background = "var(--surface-card)";
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4
          className="text-sm font-semibold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {template.label}
        </h4>
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{ color: "var(--accent)" }}
        >
          <ArrowRight size={14} />
        </div>
      </div>

      <p
        className="text-xs leading-relaxed mb-3 flex-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {template.description}
      </p>

      {/* Preview snippet */}
      <div
        className="p-2.5 rounded-md text-[11px] leading-relaxed mb-3 font-serif italic"
        style={{
          background: "var(--surface-base)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {template.preview.length > 100
          ? template.preview.slice(0, 100) + "…"
          : template.preview}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: `${cfg.accentColor}18`,
              color: cfg.accentColor,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className="flex items-center gap-1 mt-3 pt-3 border-t text-xs font-medium"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--accent)",
        }}
      >
        <Zap size={11} />
        Use this template
      </div>
    </Link>
  );
}

