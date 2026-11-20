import { ApiError, FinishReason, GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { prisma } from './prisma';
import {
  DIVISIONS, EDUCATION_OPTIONS, OCCUPATION_OPTIONS, MAZHAB_OPTIONS, FAMILY_STATUS_OPTIONS,
  INCOME_OPTIONS, FAMILY_TYPE_OPTIONS, PRAYER_OPTIONS, BEARD_HIJAB_OPTIONS, SKIN_TONE_OPTIONS,
} from './constants';

// Same fields and dropdown values as the biodata form, so an import looks like a hand-filled biodata
const opt = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values).nullable();

export const extractedBiodataSchema = z.object({
  displayName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: opt(['MALE', 'FEMALE'] as const),
  sect: z.string().nullable(),
  heightInches: z.number().int().nullable(),
  weightKg: z.number().int().nullable(),
  skinTone: opt(SKIN_TONE_OPTIONS),
  country: z.string().nullable(),
  division: opt(DIVISIONS),
  district: z.string().nullable(),
  upazila: z.string().nullable(),
  education: opt(EDUCATION_OPTIONS),
  educationDetails: z.string().nullable(),
  occupation: opt(OCCUPATION_OPTIONS),
  occupationDetails: z.string().nullable(),
  monthlyIncome: opt(INCOME_OPTIONS),
  maritalStatus: opt(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'] as const),
  numberOfChildren: z.number().int().nullable(),
  fatherAlive: z.boolean().nullable(),
  motherAlive: z.boolean().nullable(),
  siblings: z.number().int().nullable(),
  familyType: opt(FAMILY_TYPE_OPTIONS),
  familyStatus: opt(FAMILY_STATUS_OPTIONS),
  prayerHabit: opt(PRAYER_OPTIONS),
  beardOrHijab: opt(BEARD_HIJAB_OPTIONS),
  mazhab: opt(MAZHAB_OPTIONS),
  aboutMe: z.string().nullable(),
  partnerPreferences: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  guardianPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  warnings: z.array(z.string()),
});

export type ExtractedBiodata = z.infer<typeof extractedBiodataSchema>;

const list = (values: readonly string[]) => values.map((v) => `"${v}"`).join(', ');

const SYSTEM_PROMPT = `You turn a pasted matrimonial biodata (usually Bangla, sometimes English or mixed, often copied from Telegram or Facebook) into the fields of the biodata form on Zibonsathi, a Bangladeshi Islamic matrimony site. An admin reviews your result before it is published, and it should read as if the person had filled in the form themselves.

Use every piece of information in the text. Each fact goes into the most specific field that fits; anything that has no field of its own goes into aboutMe or partnerPreferences, so nothing from the source is lost.

Fields:
- displayName: the candidate's own name (not the guardian's). null if not given.
- dateOfBirth: "YYYY-MM-DD". If only month and year are given use the 1st of the month; if only an age is given, use January 1 of (current year - age) and add a warning saying the date was estimated from the age.
- gender: MALE for পাত্র/groom/ছেলে, FEMALE for পাত্রী/bride/মেয়ে. Infer it from context (e.g. hijab vs beard, "পাত্রের বায়োডাটা") when it isn't stated outright. null only if it truly can't be told.
- sect: e.g. সুন্নি, only if stated.
- heightInches: height converted to TOTAL inches as an integer (৫ ফুট ৭ ইঞ্চি / 5'7" = 67; "5.2" or "৫.২ ফুট" means 5 feet 2 inches = 62; 170 cm = 67). null if not stated.
- weightKg: weight in kilograms as an integer (৬০ কেজি = 60; convert pounds). null if not stated.
- skinTone: complexion (গাত্রবর্ণ / গায়ের রং), one of ${list(SKIN_TONE_OPTIONS)}. "উজ্জ্বল ফর্সা" = very fair, "ফর্সা" = fair, "উজ্জ্বল শ্যামলা" = light wheatish, "শ্যামলা" = wheatish/brown, "কালো" = dark.
- country: "বাংলাদেশ" for Bangladesh; otherwise the country name in Bangla. If the person lives abroad but is from Bangladesh, use the country of their permanent address.
- division: one of ${list(DIVISIONS)}. Infer it from the district when only the district is given.
- district / upazila: the permanent address (স্থায়ী ঠিকানা) district and upazila/thana, in Bangla spelling. If only a present address is given, use that. Put the other address (present or village/house details) in aboutMe.
- education: the highest level, one of ${list(EDUCATION_OPTIONS)} (স্নাতক = bachelor's/honours/BSc/BBA/fazil-level degree, স্নাতকোত্তর = master's). educationDetails: subject, institution, results, current year of study, and the full education history in readable Bangla.
- occupation: one of ${list(OCCUPATION_OPTIONS)}. occupationDetails: designation, organisation, workplace location.
- monthlyIncome: one of ${list(INCOME_OPTIONS)}, picking the band that contains the stated amount. null if not stated.
- maritalStatus: NEVER_MARRIED (অবিবাহিত), DIVORCED (ডিভোর্সড/তালাকপ্রাপ্ত), WIDOWED (বিধবা/বিপত্নীক). numberOfChildren: only for previously married people.
- fatherAlive / motherAlive: true if alive, false if deceased (মৃত/মরহুম/মরহুমা), null if not stated.
- siblings: the total number of brothers and sisters, not counting the candidate. Put their details (e.g. "২ ভাই ১ বোন, বড় ভাই বিবাহিত") in aboutMe.
- familyType: one of ${list(FAMILY_TYPE_OPTIONS)}. familyStatus: one of ${list(FAMILY_STATUS_OPTIONS)} (e.g. "নিম্নবিত্ত" maps to "নিম্নমধ্যবিত্ত").
- prayerHabit: one of ${list(PRAYER_OPTIONS)}. beardOrHijab: one of ${list(BEARD_HIJAB_OPTIONS)} (full sunnati beard / niqab = "হ্যাঁ, সম্পূর্ণরূপে"; trimmed beard / hijab without niqab = "হ্যাঁ, আংশিকভাবে"). mazhab: one of ${list(MAZHAB_OPTIONS)}.
- aboutMe: a well-organised Bangla text with one "লেবেল: মান" line per fact that has no field of its own, for example blood group, father's and mother's occupation, sibling details, present address, guardian's name and relation, Quran recitation, mahram adherence, deeni activity, hobbies, health, and any self-description. Keep the person's own wording for descriptions. null if there is nothing to put here.
- partnerPreferences: everything the person wants in a spouse (age, height, education, complexion, location, deeni requirements, other conditions), as readable Bangla lines.
- phoneNumber: the candidate's own mobile, guardianPhone: the guardian's mobile (if only one number is given and it is labelled as the guardian's or family's, it goes in guardianPhone). Write the digits as ASCII (convert Bangla digits), e.g. "01712345678".
- contactEmail: an email address if one is given.
- warnings: short Bangla notes for the admin about anything uncertain: a value you inferred rather than read, a choice between two dropdown options, conflicting information, or a missing important field (name, gender, date of birth, district, contact number). Empty array if there is nothing to flag.

Rules:
- Dropdown fields must use one of the listed values exactly, or null. If the text says something the options can't express exactly, choose the closest option and put the exact wording in the matching details field or in aboutMe.
- Never invent information. A field the text doesn't support is null.
- Free text stays in Bangla; translate English or mixed text into natural Bangla, but keep names, institution names and designations as written.`;

export class ExtractionError extends Error {}

// Settings (Admin → সেটিংস → AI বায়োডাটা ইমপোর্ট). The key is a secret: never sent back to the browser.
export const AI_SETTINGS = { geminiKey: 'gemini_api_key', geminiModel: 'gemini_model' } as const;
export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

const userMessage = (text: string) => `Today's date: ${new Date().toISOString().slice(0, 10)}\n\n<biodata>\n${text}\n</biodata>`;

/** Read a pasted biodata into form fields with Gemini. Throws ExtractionError (Bangla message) on failure. */
export async function extractBiodata(text: string): Promise<ExtractedBiodata> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(AI_SETTINGS) } } });
  const get = (key: string) => rows.find((r) => r.key === key)?.value.trim() ?? '';

  // Key saved in Admin → সেটিংস wins; GEMINI_API_KEY in .env is the fallback
  const apiKey = get(AI_SETTINGS.geminiKey) || process.env.GEMINI_API_KEY?.trim() || '';
  if (!apiKey) throw new ExtractionError('Gemini API কী দেওয়া নেই। অ্যাডমিন → সেটিংস → AI বায়োডাটা ইমপোর্ট এ কী দিন।');
  return extractWithGemini(text, apiKey, get(AI_SETTINGS.geminiModel) || DEFAULT_GEMINI_MODEL);
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

/** Zod's JSON Schema, reshaped to the subset Gemini's responseJsonSchema accepts (no $schema, no type arrays) */
function geminiSchema(): unknown {
  const fix = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(fix);
    if (!node || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === '$schema') continue;
      // Zod adds ±MAX_SAFE_INTEGER bounds to every int; they carry no meaning here
      if ((k === 'minimum' || k === 'maximum') && typeof v === 'number' && Math.abs(v) >= Number.MAX_SAFE_INTEGER) continue;
      out[k] = fix(v);
    }
    if (Array.isArray(out.type)) {
      const types = out.type as string[];
      delete out.type;
      return { anyOf: types.map((t) => ({ ...out, type: t })) };
    }
    return out;
  };
  return fix(z.toJSONSchema(extractedBiodataSchema));
}

// Tried in order when the configured model stays overloaded (503); another model usually has capacity
const FALLBACK_GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
const RETRY_DELAYS_MS = [2000, 5000];
const status = (e: unknown) => (e instanceof ApiError ? e.status : undefined);
const isTransient = (e: unknown) => [500, 503, 504].includes(status(e) ?? 0);
// Free-tier quota is counted per model, so a model that is out of quota (429) or unavailable (404)
// says nothing about the others: move on to the next model instead of giving up
const tryNextModel = (e: unknown) => isTransient(e) || status(e) === 429 || status(e) === 404;

/**
 * generateContent with retries on Google-side overload (503/500), then one try on each fallback model.
 * If every model fails, reports overload when any model was busy (worth retrying soon), else quota.
 */
async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>
) {
  const errors: unknown[] = [];
  const models = [model, ...FALLBACK_GEMINI_MODELS.filter((m) => m !== model)];
  for (const [i, current] of models.entries()) {
    // The chosen model gets every retry; each fallback gets one quick retry if busy
    const delays = i === 0 ? RETRY_DELAYS_MS : RETRY_DELAYS_MS.slice(0, 1);
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model: current });
      } catch (error) {
        if (!tryNextModel(error)) throw error;
        errors.push(error);
        if (!isTransient(error)) break; // out of quota / unavailable: retrying this model won't help
        if (attempt < delays.length) await new Promise((r) => setTimeout(r, delays[attempt]));
      }
    }
    if (i < models.length - 1) console.warn(`Gemini model ${current} failed (${status(errors.at(-1))}), trying ${models[i + 1]}`);
  }
  throw errors.find(isTransient) ?? errors.find((e) => status(e) === 429) ?? errors[0];
}

async function extractWithGemini(text: string, apiKey: string, model: string): Promise<ExtractedBiodata> {
  const ai = new GoogleGenAI({ apiKey });
  let raw: string | undefined;
  try {
    const response = await generateWithRetry(ai, model, {
      contents: userMessage(text),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: geminiSchema(),
        maxOutputTokens: 16000,
      },
    });
    const finish = response.candidates?.[0]?.finishReason;
    if (finish === FinishReason.MAX_TOKENS) throw new ExtractionError('AI এর উত্তর অসম্পূর্ণ এসেছে। আবার চেষ্টা করুন।');
    if (finish === FinishReason.SAFETY || response.promptFeedback?.blockReason) {
      throw new ExtractionError('AI এই লেখাটি প্রসেস করতে পারেনি। লেখাটি দেখে আবার চেষ্টা করুন।');
    }
    raw = response.text;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    if (error instanceof ApiError) {
      console.error('Gemini API error:', error.status, error.message);
      if (error.status === 400 && /api key/i.test(error.message)) {
        throw new ExtractionError('Gemini API কী সঠিক নয়। অ্যাডমিন → সেটিংস এ সঠিক কী দিন।');
      }
      if (error.status === 401 || error.status === 403) {
        throw new ExtractionError('Gemini API কী সঠিক নয় বা এর অনুমতি নেই। অ্যাডমিন → সেটিংস এ সঠিক কী দিন।');
      }
      if (error.status === 404) throw new ExtractionError(`Gemini মডেল "${model}" পাওয়া যায়নি। সেটিংস এ মডেলের নাম ঠিক করুন।`);
      if (error.status === 429) throw new ExtractionError('Gemini এর আজকের ফ্রি ব্যবহারের সীমা শেষ (সব মডেলের)। কোটা প্রতিদিন রিসেট হয়, অথবা Google AI Studio তে বিলিং চালু করলে সীমা অনেক বেড়ে যাবে।');
      if (isTransient(error)) {
        throw new ExtractionError('Gemini এখন অনেক ব্যস্ত (Google এর সার্ভারে চাপ)। কয়েক মিনিট পর আবার চেষ্টা করুন।');
      }
      throw new ExtractionError('Gemini সার্ভিসে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন।');
    }
    console.error('Gemini error:', error);
    throw new ExtractionError('Gemini এ সংযোগ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
  }

  let json: unknown;
  try {
    json = JSON.parse(raw ?? '');
  } catch {
    throw new ExtractionError('AI এর উত্তর পড়া যায়নি। আবার চেষ্টা করুন।');
  }
  const parsed = extractedBiodataSchema.safeParse(json);
  if (!parsed.success) {
    console.error('Gemini output did not match schema:', parsed.error.issues.slice(0, 5));
    throw new ExtractionError('AI এর উত্তর ঠিক ফরম্যাটে আসেনি। আবার চেষ্টা করুন।');
  }
  return parsed.data;
}
