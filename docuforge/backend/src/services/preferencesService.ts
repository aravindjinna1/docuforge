import { UserPreferences, IUserPreferences } from "../models/UserPreferences";
import type { DocumentType, ToneType, AnyDocumentInputs, PromptContext } from "../types";


export async function getOrCreatePreferences(
  userId: string
): Promise<IUserPreferences> {

  const existing = await UserPreferences.findOne({ userId });
  if (existing) return existing;

  return UserPreferences.create({ userId });
}

export async function getPromptContext(
  userId: string
): Promise<PromptContext> {

  const prefs = await getOrCreatePreferences(userId);
  return {
    preferredTone: prefs.preferredTone,
    commonNames: prefs.commonNames.slice(0, 5),
    commonCompanies: prefs.commonCompanies.slice(0, 5),
  };
}

// ─── Update preferences based on a completed generation ───────────
export async function recordGeneration(
  userId: string,

  docType: DocumentType,
  inputs: AnyDocumentInputs
): Promise<void> {
  const prefs = await getOrCreatePreferences(userId);
  const i = inputs as unknown as Record<string, string>;

  // Increment document type count
  const currentCount = (prefs.documentTypeCounts.get(docType) ?? 0) as number;
  prefs.documentTypeCounts.set(docType, currentCount + 1);

  // Derive most-used type
  let maxCount = 0;
  let mostUsed: DocumentType | null = null;
  for (const [type, count] of prefs.documentTypeCounts.entries()) {
    if ((count as number) > maxCount) {
      maxCount = count as number;
      mostUsed = type as DocumentType;
    }
  }
  prefs.mostUsedDocumentType = mostUsed;

  // Extract names from various input fields
  const nameFields = ["fromName", "candidateName", "employeeName", "name"];
  for (const field of nameFields) {
    const val = i[field]?.trim();
    if (val && !prefs.commonNames.includes(val)) {
      prefs.commonNames = [val, ...prefs.commonNames].slice(0, 10);
    }
  }

  // Extract company names
  const companyFields = ["company"];
  for (const field of companyFields) {
    const val = i[field]?.trim();
    if (val && !prefs.commonCompanies.includes(val)) {
      prefs.commonCompanies = [val, ...prefs.commonCompanies].slice(0, 10);
    }
  }

  // Capture preferred tone
  const tone = (i["tone"] as ToneType) || null;
  if (tone) prefs.preferredTone = tone;

  // Store last-used inputs for this doc type (for pre-fill)
  prefs.lastUsedInputs.set(docType, inputs as unknown as Record<string, unknown>);

  prefs.markModified("documentTypeCounts");
  prefs.markModified("lastUsedInputs");
  await prefs.save();
}

export async function getPersonalizationData(userId: string): Promise<{
  preferredTone: ToneType;
  mostUsedDocumentType: DocumentType | null;
  commonNames: string[];
  commonCompanies: string[];
  documentTypeCounts: Record<string, number>;
  lastUsedInputs: Record<string, Record<string, unknown>>;
  suggestedTypes: DocumentType[];
}> {
  const prefs = await getOrCreatePreferences(userId);

  // Top 3 most-used types for suggestions
  const sorted = [...prefs.documentTypeCounts.entries()]
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([type]) => type as DocumentType);

  const countObj: Record<string, number> = {};
  for (const [k, v] of prefs.documentTypeCounts.entries()) {
    countObj[k] = v as number;
  }

  const inputsObj: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of prefs.lastUsedInputs.entries()) {
    inputsObj[k] = v as Record<string, unknown>;
  }

  return {
    preferredTone: prefs.preferredTone,
    mostUsedDocumentType: prefs.mostUsedDocumentType,
    commonNames: prefs.commonNames,
    commonCompanies: prefs.commonCompanies,
    documentTypeCounts: countObj,
    lastUsedInputs: inputsObj,
    suggestedTypes: sorted,
  };
}
