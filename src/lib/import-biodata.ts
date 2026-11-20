import { Gender, MaritalStatus, ProfileStatus } from '@prisma/client';
import { prisma } from './prisma';
import { IMPORTED_EMAIL_DOMAIN } from './imported-biodata';
import { normalizePhone } from './phone';

/** Normalized biodata fields, ready to store (same columns a member fills in on the biodata form) */
export interface ImportBiodataFields {
  displayName: string | null;
  dateOfBirth: Date | null;
  gender: Gender;
  religion: string | null;
  sect: string | null;
  heightInches?: number | null;
  weightKg?: number | null;
  skinTone?: string | null;
  country: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  education: string | null;
  educationDetails: string | null;
  occupation: string | null;
  occupationDetails: string | null;
  monthlyIncome: string | null;
  maritalStatus: MaritalStatus | null;
  numberOfChildren: number | null;
  fatherAlive: boolean | null;
  motherAlive: boolean | null;
  siblings: number | null;
  familyType: string | null;
  familyStatus: string | null;
  prayerHabit: string | null;
  beardOrHijab: string | null;
  mazhab: string | null;
  aboutMe: string | null;
  partnerPreferences: string | null;
  phoneNumber: string | null;
  guardianPhone: string | null;
  contactEmail: string | null;
}

/**
 * Create an imported biodata: a placeholder account (marks it as imported, so its contact is free)
 * plus a PENDING_APPROVAL profile with a ZBM/ZBF number. Used by the n8n webhook and the admin import page.
 */
export async function createImportedBiodata(fields: ImportBiodataFields, source: string) {
  const uniqueId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const placeholderEmail = `${uniqueId}${IMPORTED_EMAIL_DOMAIN}`;
  const email = fields.contactEmail?.includes('@') ? fields.contactEmail.trim().toLowerCase() : null;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: placeholderEmail, name: fields.displayName || 'Imported Biodata', emailVerified: null },
    });

    // Generate the biodata number inline (assignBiodataId can't run inside this transaction)
    const prefix = fields.gender === 'MALE' ? 'ZBM' : 'ZBF';
    const last = await tx.profile.findFirst({
      where: { oderId: { startsWith: prefix } },
      orderBy: { oderId: 'desc' },
      select: { oderId: true },
    });
    const nextNumber = (parseInt(last?.oderId?.match(/\d+$/)?.[0] ?? '0', 10) || 0) + 1;
    const biodataId = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;

    const profile = await tx.profile.create({
      data: {
        ...fields,
        userId: user.id,
        oderId: biodataId,
        status: ProfileStatus.PENDING_APPROVAL,
        religion: fields.religion || 'ইসলাম',
        country: fields.country || 'বাংলাদেশ',
        // Stored normalized like member-entered numbers (01XXXXXXXXX); keep the raw text if it isn't a valid number
        phoneNumber: fields.phoneNumber ? normalizePhone(fields.phoneNumber) ?? fields.phoneNumber : null,
        guardianPhone: fields.guardianPhone ? normalizePhone(fields.guardianPhone) ?? fields.guardianPhone : null,
        contactEmail: email,
        adminNote: `Imported on ${new Date().toISOString()}. Source: ${source}`,
      },
    });

    return { user, profile, biodataId };
  });
}
