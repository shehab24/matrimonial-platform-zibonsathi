'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { extractBiodata, extractedBiodataSchema, ExtractionError, type ExtractedBiodata } from '@/lib/biodata-extract';
import { createImportedBiodata } from '@/lib/import-biodata';
import { adminBiodataHref } from '@/lib/biodata-url';

const MAX_TEXT = 20_000;

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'ADMIN';
}

/** Step 1: read pasted biodata text into form fields (nothing is saved yet) */
export async function extractBiodataFromText(text: string) {
  if (!(await isAdmin())) return { success: false as const, error: 'অনুমতি নেই' };
  const trimmed = text.trim();
  if (trimmed.length < 30) return { success: false as const, error: 'বায়োডাটার পুরো লেখাটি পেস্ট করুন।' };
  if (trimmed.length > MAX_TEXT) return { success: false as const, error: 'লেখাটি অনেক বড়। একবারে একটি বায়োডাটা দিন।' };

  try {
    return { success: true as const, data: await extractBiodata(trimmed) };
  } catch (error) {
    return { success: false as const, error: error instanceof ExtractionError ? error.message : 'পার্স করা যায়নি' };
  }
}

/** Step 2: save the reviewed fields as a pending imported biodata; returns the admin edit page to finish it */
export async function importExtractedBiodata(data: ExtractedBiodata) {
  if (!(await isAdmin())) return { success: false as const, error: 'অনুমতি নেই' };

  const parsed = extractedBiodataSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: 'তথ্য সঠিক নয়, আবার পার্স করুন।' };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- warnings are only for the preview
  const { warnings, gender, dateOfBirth, ...rest } = parsed.data;
  if (!gender) return { success: false as const, error: 'পাত্র না পাত্রী তা নির্বাচন করুন।' };

  const dob = dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? new Date(`${dateOfBirth}T00:00:00Z`) : null;

  try {
    const { profile } = await createImportedBiodata(
      { ...rest, gender, dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : null, religion: 'ইসলাম' },
      'admin AI import'
    );
    revalidatePath('/admin/biodatas');
    return { success: true as const, editHref: `${adminBiodataHref(profile)}/edit` };
  } catch (error) {
    console.error('importExtractedBiodata error:', error);
    return { success: false as const, error: 'সংরক্ষণ করা যায়নি, আবার চেষ্টা করুন।' };
  }
}
