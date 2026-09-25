import type {
  DocumentType,
  AnyDocumentInputs,
  PromptContext,
  RefineAction,
  EmailInputs,
  CoverLetterInputs,
  LeaveLetterInputs,
  ResignationLetterInputs,
  ResumeInputs,
  CustomDocumentInputs,
  MemoInputs,
  ProposalInputs,
  AgreementInputs,
  MeetingMinutesInputs,
  ReportInputs,
} from "../types";

// ─── Shared rules injected into every system prompt ────────────────
const UNIVERSAL_RULES = `
STRICT OUTPUT RULES — follow every one without exception:
1. Output ONLY the document body. No preamble, no meta-commentary, no sign-off note to the requester.
2. Plain prose paragraphs separated by a single blank line. No markdown headers (#), no asterisks, no bullet points, no numbered lists.
3. No emojis anywhere.
4. Do not use placeholder text such as [Your Name] or [Date]. Use the actual values provided. If a value is not provided, omit that element gracefully.
5. Dates written as: Month DD, YYYY (e.g., January 15, 2025).
6. No filler phrases: avoid "I hope this email finds you well", "Please feel free to", "Do not hesitate to".
7. One document, ready to send. Nothing else.
`.trim();

// ─── Per-type system prompts ───────────────────────────────────────
function getSystemPrompt(docType: DocumentType): string {
  const base: Record<DocumentType, string> = {
    email: `You are a senior corporate communications writer with 20 years of experience drafting executive-level business correspondence.
Your emails are known for precision, purposeful structure, and respect for the reader's time.
Structure: formal salutation → context/reason → body → clear ask or next step → professional closing with sender name.
${UNIVERSAL_RULES}`,

    cover_letter: `You are a professional career coach and writer who has helped hundreds of candidates land senior roles.
Your cover letters are confident without being arrogant, specific without being exhaustive, and always focused on value to the employer.
Structure: date and address block → opening paragraph (position + hook) → experience paragraph (concrete achievements) → fit paragraph (why this company) → closing paragraph (call to action) → signature.
${UNIVERSAL_RULES}`,

    leave_letter: `You are an HR professional drafting formal leave request correspondence.
Your letters are concise, complete, and professionally deferential without being obsequious.
Structure: date → formal salutation → opening statement of request → dates and leave type → brief reason → assurance of work coverage → formal closing.
${UNIVERSAL_RULES}`,

    resignation_letter: `You are an executive career consultant drafting resignation letters that preserve professional relationships.
Regardless of the circumstances of the departure, you write with warmth, professionalism, and forward-looking gratitude.
Structure: date → formal salutation → clear resignation statement with last working day → acknowledgment of the opportunity → brief reason (if provided, framed constructively) → offer to assist with transition → professional closing.
${UNIVERSAL_RULES}`,

    resume: `You are a senior technical recruiter and resume writer who has reviewed over 10,000 resumes.
You write resume content that is ATS-optimized, achievement-focused (not duty-focused), and written in implied first person (no "I" or "my").
Structure: PROFESSIONAL SUMMARY (3–4 sentences, third-person implied) → CORE SKILLS (prose sentence listing key skills) → PROFESSIONAL EXPERIENCE (narrative paragraphs per role with achievements) → EDUCATION.
Each section heading on its own line in ALL CAPS, followed by the content.
${UNIVERSAL_RULES}`,

    custom: `You are a senior corporate document writer capable of producing any formal business document with precision and authority.
Analyze the context and purpose provided and select the most appropriate document structure.
${UNIVERSAL_RULES}`,

    memo: `You are an internal communications specialist drafting official company memos.
Your memos are clear, authoritative, and action-oriented. Employees should understand the what, why, and next steps immediately.
Structure: MEMORANDUM header → TO / FROM / DATE / SUBJECT lines → purpose statement → background context → detailed body → action items or deadlines → closing.
${UNIVERSAL_RULES}`,

    proposal: `You are a senior business development consultant who has won multi-million dollar contracts.
Your proposals are persuasive, professional, and structured to build confidence with the prospective client.
Structure: title → prepared for/by lines → executive summary → problem statement → proposed solution → deliverables → timeline → budget/investment → next steps.
${UNIVERSAL_RULES}`,

    agreement: `You are a legal document specialist drafting clear, enforceable agreements and memoranda of understanding.
Your agreements use precise language while remaining accessible to non-lawyers.
Structure: title → parties involved → effective date → recitals/background → agreement terms and conditions → duration and termination → signatures block.
${UNIVERSAL_RULES}`,

    meeting_minutes: `You are an executive assistant skilled at capturing precise meeting minutes.
Your minutes are structured, factual, and action-oriented with clear owners and deadlines.
Structure: meeting title → date/time → attendees → agenda items → discussion summary per agenda item → decisions made → action items with owners → next meeting.
${UNIVERSAL_RULES}`,

    report: `You are a senior business analyst writing professional reports for executive stakeholders.
Your reports are data-driven, structured, and include actionable recommendations.
Structure: title → prepared by/date → executive summary → background/context → detailed findings → analysis → recommendations → conclusion.
${UNIVERSAL_RULES}`,
  };

  return base[docType];
}

// ─── Per-type user prompt builders ─────────────────────────────────
function buildEmailPrompt(inputs: EmailInputs, ctx: PromptContext): string {
  const tone = inputs.tone || ctx.preferredTone || "professional";
  const lengthGuide = {
    short: "3 to 5 sentences total",
    medium: "2 to 3 substantive paragraphs",
    long: "4 or more paragraphs with full detail",
  }[inputs.length] || "2 to 3 paragraphs";

  return `Write a business email with the following specifications.

From: ${inputs.fromName}
To: ${inputs.toName}
Subject: ${inputs.subject}
Tone: ${tone}
Length: ${lengthGuide}

Purpose and context:
${inputs.purpose}

Write the complete email including salutation, body, and closing.`;
}

function buildCoverLetterPrompt(inputs: CoverLetterInputs, ctx: PromptContext): string {
  const tone = inputs.tone || ctx.preferredTone || "professional";

  return `Write a cover letter with the following details.

Candidate: ${inputs.candidateName}
Position: ${inputs.role}
Company: ${inputs.company}
Tone: ${tone}

Experience summary:
${inputs.experienceSummary}

Key skills:
${inputs.skills}

Write a complete cover letter including the date line, inside address (using the company name), salutation, body, and signature block.`;
}

function buildLeaveLetterPrompt(inputs: LeaveLetterInputs, _ctx: PromptContext): string {
  return `Write a formal leave request letter with the following details.

Employee: ${inputs.employeeName}
Manager: ${inputs.managerName}
Leave type: ${inputs.leaveType}
From: ${inputs.fromDate}
To: ${inputs.toDate}

Reason:
${inputs.reason}

Write a complete formal letter including today's date, inside address, salutation, body, and professional closing.`;
}

function buildResignationLetterPrompt(inputs: ResignationLetterInputs, _ctx: PromptContext): string {
  const reasonBlock = inputs.reason
    ? `\nReason (frame constructively, do not quote verbatim): ${inputs.reason}`
    : "";
  const tenureBlock = inputs.yearsWorked
    ? `\nTenure at company: ${inputs.yearsWorked}`
    : "";

  return `Write a resignation letter with the following details.

Employee: ${inputs.employeeName}
Manager: ${inputs.managerName}
Company: ${inputs.company}
Last working day: ${inputs.lastWorkingDay}${tenureBlock}${reasonBlock}

Write a complete resignation letter including the date, inside address, salutation, body, and professional closing.`;
}

function buildResumePrompt(inputs: ResumeInputs, _ctx: PromptContext): string {
  const targetRoleBlock = inputs.targetRole
    ? `\nTarget role: ${inputs.targetRole}`
    : "";

  return `Write professional resume content for the following person.

Name: ${inputs.name}
Email: ${inputs.email}
Phone: ${inputs.phone}${targetRoleBlock}

Skills:
${inputs.skills}

Experience:
${inputs.experienceSummary}

Education:
${inputs.education}

Write the four sections: PROFESSIONAL SUMMARY, CORE SKILLS, PROFESSIONAL EXPERIENCE, EDUCATION. Use ALL CAPS for each section heading on its own line.`;
}

function buildCustomPrompt(inputs: CustomDocumentInputs, ctx: PromptContext): string {
  const tone = inputs.tone || ctx.preferredTone || "formal";
  const senderBlock = inputs.sender ? `\nFrom: ${inputs.sender}` : "";
  const recipientBlock = inputs.recipient ? `\nTo: ${inputs.recipient}` : "";

  return `Write a formal document titled "${inputs.title}".

Tone: ${tone}${senderBlock}${recipientBlock}

Context and purpose:
${inputs.context}

Write the complete document with an appropriate opening, substantive body, and professional closing.`;
}

function buildMemoPrompt(inputs: MemoInputs, ctx: PromptContext): string {
  const tone = inputs.tone || ctx.preferredTone || "formal";
  return `Write an internal memo with the following details.

Title: ${inputs.title}
From: ${inputs.from}
To: ${inputs.to}
Subject: ${inputs.subject}
Tone: ${tone}

Context:
${inputs.context}

Write a complete internal memo with MEMORANDUM header, TO/FROM/DATE/SUBJECT lines, purpose statement, body, and any action items.`;
}

function buildProposalPrompt(inputs: ProposalInputs, _ctx: PromptContext): string {
  return `Write a business proposal with the following details.

Title: ${inputs.title}
Prepared for: ${inputs.clientName}
Prepared by: ${inputs.preparedBy}

Project Scope:
${inputs.projectScope}

Deliverables:
${inputs.deliverables}

Timeline:
${inputs.timeline}

Budget:
${inputs.budget}

Write a complete business proposal including executive summary, problem statement, proposed solution, deliverables, timeline, and budget sections.`;
}

function buildAgreementPrompt(inputs: AgreementInputs, _ctx: PromptContext): string {
  return `Write a formal agreement with the following details.

Title: ${inputs.title}
Party A: ${inputs.partyA}
Party B: ${inputs.partyB}
Effective Date: ${inputs.effectiveDate}

Scope:
${inputs.scope}

Terms:
${inputs.terms}

Duration:
${inputs.duration}

Write a complete agreement including parties, effective date, recitals, terms and conditions, duration, and signature blocks.`;
}

function buildMeetingMinutesPrompt(inputs: MeetingMinutesInputs, _ctx: PromptContext): string {
  return `Write meeting minutes with the following details.

Meeting: ${inputs.meetingTitle}
Date: ${inputs.date}
Chaired by: ${inputs.chairedBy}
Attendees: ${inputs.attendees}

Agenda:
${inputs.agenda}

Discussion Summary:
${inputs.discussion}

Action Items:
${inputs.actionItems}

Write comprehensive meeting minutes including attendees, agenda items, discussion points, decisions made, and action items with owners.`;
}

function buildReportPrompt(inputs: ReportInputs, _ctx: PromptContext): string {
  return `Write a business report with the following details.

Title: ${inputs.title}
Prepared by: ${inputs.preparedBy}
Date: ${inputs.date}

Executive Summary:
${inputs.summary}

Body:
${inputs.body}

Findings:
${inputs.findings}

Recommendations:
${inputs.recommendations}

Write a complete business report including executive summary, background, detailed findings, analysis, and actionable recommendations.`;
}

// ─── Refinement prompt builder ─────────────────────────────────────
function buildRefinePrompt(
  action: RefineAction,
  existingContent: string,
  docType: DocumentType
): string {
  const docLabel = docType.replace(/_/g, " ");

  const instructions: Record<RefineAction, string> = {
    regenerate: `Rewrite this ${docLabel} completely. Keep all the core information but use entirely different phrasing, sentence structure, and paragraph organization. The result must feel like a different writer wrote it.`,
    shorten: `Shorten this ${docLabel} by removing approximately 35% of the content. Preserve every key point and all critical information. Cut filler, redundancy, and any sentence that doesn't add new information.`,
    improve_tone: `Revise this ${docLabel} to improve the quality of the writing. Strengthen word choice, vary sentence rhythm, eliminate weak constructions (passive voice where active serves better, vague qualifiers, hedging phrases), and make the voice more confident and precise.`,
    make_formal: `Rewrite this ${docLabel} in a strictly formal register. Remove all contractions, informal phrasing, and casual constructions. Every sentence should meet the standard of executive-level corporate correspondence.`,
  };

  return `${instructions[action]}

Output only the revised document. Do not explain what you changed.

---
${existingContent}
---`;
}

// ─── Public interface ───────────────────────────────────────────────
export function buildGenerationPrompt(
  docType: DocumentType,
  inputs: AnyDocumentInputs,
  ctx: PromptContext = {}
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = getSystemPrompt(docType);

  const builders: Record<DocumentType, (i: AnyDocumentInputs, c: PromptContext) => string> = {
    email: (i, c) => buildEmailPrompt(i as EmailInputs, c),
    cover_letter: (i, c) => buildCoverLetterPrompt(i as CoverLetterInputs, c),
    leave_letter: (i, c) => buildLeaveLetterPrompt(i as LeaveLetterInputs, c),
    resignation_letter: (i, c) => buildResignationLetterPrompt(i as ResignationLetterInputs, c),
    resume: (i, c) => buildResumePrompt(i as ResumeInputs, c),
    custom: (i, c) => buildCustomPrompt(i as CustomDocumentInputs, c),
    memo: (i, c) => buildMemoPrompt(i as MemoInputs, c),
    proposal: (i, c) => buildProposalPrompt(i as ProposalInputs, c),
    agreement: (i, c) => buildAgreementPrompt(i as AgreementInputs, c),
    meeting_minutes: (i, c) => buildMeetingMinutesPrompt(i as MeetingMinutesInputs, c),
    report: (i, c) => buildReportPrompt(i as ReportInputs, c),
  };

  return {
    systemPrompt,
    userPrompt: builders[docType](inputs, ctx),
  };
}

export function buildRefineGenerationPrompt(
  docType: DocumentType,
  action: RefineAction,
  existingContent: string
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: getSystemPrompt(docType),
    userPrompt: buildRefinePrompt(action, existingContent, docType),
  };
}

// ─── Document title extractor ───────────────────────────────────────
export function deriveDocumentTitle(
  docType: DocumentType,
  inputs: AnyDocumentInputs
): string {
  const i = inputs as unknown as Record<string, string>;

  const derivers: Record<DocumentType, () => string> = {
    email: () => `Email — ${i["subject"] || "Untitled"}`,
    cover_letter: () =>
      `Cover Letter — ${i["role"] || "Role"} at ${i["company"] || "Company"}`,
    leave_letter: () =>
      `${i["leaveType"] || "Leave"} Request — ${i["fromDate"] || ""}`,
    resignation_letter: () =>
      `Resignation Letter — ${i["company"] || "Company"}`,
    resume: () => `Resume — ${i["name"] || "Candidate"}`,
    custom: () => i["title"] || "Custom Document",
    memo: () => `Memo — ${i["subject"] || i["title"] || "Internal Memo"}`,
    proposal: () => `Proposal — ${i["title"] || i["clientName"] || "Business Proposal"}`,
    agreement: () => `Agreement — ${i["title"] || "Agreement"}`,
    meeting_minutes: () => `Meeting Minutes — ${i["meetingTitle"] || "Meeting"}`,
    report: () => `Report — ${i["title"] || "Business Report"}`,
  };

  return derivers[docType]();
}

