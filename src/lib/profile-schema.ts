import { z } from 'zod';
import { HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES, WEIGHT_MIN_KG, WEIGHT_MAX_KG } from '@/lib/constants';

// Empty inputs arrive as '' (text) or NaN (cleared number fields) - store them as null
const optText = z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(5000).nullish());
const toNum = (v: unknown) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v));
const intIn = (min: number, max: number) => z.preprocess(toNum, z.number().int().min(min).max(max).nullish());
const optInt = intIn(0, 50);

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
  heightInches: intIn(HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES),
  weightKg: intIn(WEIGHT_MIN_KG, WEIGHT_MAX_KG),
  skinTone: optText,
  aboutMe: optText,
  partnerPreferences: optText,
  phoneNumber: optText,
  guardianPhone: optText,
  contactEmail: z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim().toLowerCase()) : v),
    z.string().email().max(200).nullish()
  ),
  hadiaPledge: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v)),
    z.number().int().min(0).max(10_000_000).nullish()
  ),
  removalPledgeAccepted: z.boolean().optional(),
});

// What an admin may edit: the member's fields, minus the member's own commitments (pledges)
export const adminProfileInputSchema = profileInputSchema.omit({ hadiaPledge: true, removalPledgeAccepted: true });
