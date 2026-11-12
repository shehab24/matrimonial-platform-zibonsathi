import { z } from 'zod';

// Empty inputs arrive as '' (text) or NaN (cleared number fields) - store them as null
const optText = z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(5000).nullish());
const optInt = z.preprocess(
  (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v)),
  z.number().int().min(0).max(50).nullish()
);

// Only the fields a member may edit. Anything else the client sends (status, oderId,
// approvedAt, photos, adminNote...) is stripped, so it can't be written through this action
export const profileInputSchema = z.object({
  displayName: optText,
  dateOfBirth: optText,
  gender: z.preprocess((v) => (v === '' ? null : v), z.enum(['MALE', 'FEMALE']).nullish()),
  division: optText,
  district: optText,
  upazila: optText,
  country: optText,
  education: optText,
  educationDetails: optText,
  occupation: optText,
  occupationDetails: optText,
  monthlyIncome: optText,
  maritalStatus: z.preprocess((v) => (v === '' ? null : v), z.enum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED']).nullish()),
  numberOfChildren: optInt,
  fatherAlive: z.boolean().nullish(),
  motherAlive: z.boolean().nullish(),
  siblings: optInt,
  familyType: optText,
  familyStatus: optText,
  prayerHabit: optText,
  beardOrHijab: optText,
  mazhab: optText,
  sect: optText,
  aboutMe: optText,
  partnerPreferences: optText,
  phoneNumber: optText,
  guardianPhone: optText,
  hadiaPledge: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v)),
    z.number().int().min(0).max(10_000_000).nullish()
  ),
  removalPledgeAccepted: z.boolean().optional(),
});

// What an admin may edit: the member's fields, minus the member's own commitments (pledges)
export const adminProfileInputSchema = profileInputSchema.omit({ hadiaPledge: true, removalPledgeAccepted: true });
