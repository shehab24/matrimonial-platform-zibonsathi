import { NextResponse } from 'next/server';
import { Gender, MaritalStatus } from '@prisma/client';
import { createImportedBiodata } from '@/lib/import-biodata';

// API key for n8n webhook authentication
const API_KEY = process.env.BIODATA_IMPORT_API_KEY;

// Validate API key
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !API_KEY) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === API_KEY;
}

// Parse gender from extracted text
function parseGender(value: string | undefined): Gender | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  // Check female FIRST (because "female" contains "male")
  if (lower.includes('female') || lower.includes('মহিলা') || lower.includes('নারী') || lower.includes('মেয়ে')) return 'FEMALE';
  if (lower.includes('male') || lower.includes('পুরুষ') || lower.includes('ছেলে')) return 'MALE';
  return null;
}

// Parse marital status
function parseMaritalStatus(value: string | undefined): MaritalStatus | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('never') || lower.includes('unmarried') || lower.includes('অবিবাহিত')) return 'NEVER_MARRIED';
  if (lower.includes('divorced') || lower.includes('তালাকপ্রাপ্ত')) return 'DIVORCED';
  if (lower.includes('widow') || lower.includes('বিধবা') || lower.includes('বিপত্নীক')) return 'WIDOWED';
  return null;
}

// Parse boolean from text
function parseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('yes') || lower.includes('হ্যাঁ') || lower.includes('জীবিত') || lower.includes('alive')) return true;
  if (lower.includes('no') || lower.includes('না') || lower.includes('মৃত') || lower.includes('dead') || lower.includes('deceased')) return false;
  return null;
}

// Parse integer
function parseInteger(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// Parse date (accepts various formats)
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  // Validate API key
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Required: gender must be determined
    const gender = parseGender(data.gender);
    if (!gender) {
      return NextResponse.json({ 
        error: 'Gender is required. Please specify male/female or পুরুষ/মহিলা',
        field: 'gender'
      }, { status: 400 });
    }

    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const result = await createImportedBiodata(
      {
        displayName: text(data.displayName || data.name),
        dateOfBirth: parseDate(data.dateOfBirth || data.dob),
        gender,
        religion: text(data.religion),
        sect: text(data.sect),
        country: text(data.country),
        division: text(data.division),
        district: text(data.district),
        upazila: text(data.upazila || data.area),
        education: text(data.education),
        educationDetails: text(data.educationDetails || data.educationDetail),
        occupation: text(data.occupation || data.job),
        occupationDetails: text(data.occupationDetails || data.occupationDetail),
        monthlyIncome: text(data.monthlyIncome || data.income),
        maritalStatus: parseMaritalStatus(data.maritalStatus),
        numberOfChildren: parseInteger(data.numberOfChildren || data.children),
        fatherAlive: parseBoolean(data.fatherAlive || data.father),
        motherAlive: parseBoolean(data.motherAlive || data.mother),
        siblings: parseInteger(data.siblings || data.brothersSisters),
        familyType: text(data.familyType),
        familyStatus: text(data.familyStatus || data.familyCondition),
        prayerHabit: text(data.prayerHabit || data.prayer),
        beardOrHijab: text(data.beardOrHijab || data.beard || data.hijab),
        mazhab: text(data.mazhab || data.madhab),
        aboutMe: text(data.aboutMe || data.about || data.bio),
        partnerPreferences: text(data.partnerPreferences || data.lookingFor || data.preference),
        phoneNumber: text(data.phoneNumber || data.phone || data.mobile),
        guardianPhone: text(data.guardianPhone || data.guardianMobile),
        contactEmail: text(data.contactEmail || data.email || data.emailAddress || data.personalEmail || data.mail || data.contact_email),
      },
      data.source || 'n8n/telegram'
    );

    return NextResponse.json({
      success: true,
      message: 'Biodata imported successfully',
      data: {
        biodataId: result.biodataId,
        profileId: result.profile.id,
        userId: result.user.id,
        gender: gender,
        name: data.displayName || data.name,
        status: 'PENDING_APPROVAL',
      }
    });

  } catch (error) {
    console.error('Import biodata error:', error);
    return NextResponse.json({ 
      error: 'Failed to import biodata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to test if API is working
export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Biodata import API is ready',
    fields: [
      'displayName/name', 'dateOfBirth/dob', 'gender',
      'country', 'division', 'district', 'upazila/area',
      'education', 'educationDetails', 'occupation', 'occupationDetails', 'monthlyIncome/income',
      'maritalStatus', 'numberOfChildren/children', 'fatherAlive/father', 'motherAlive/mother', 'siblings',
      'familyType', 'familyStatus', 'prayerHabit/prayer', 'beardOrHijab', 'mazhab',
      'aboutMe/bio', 'partnerPreferences/lookingFor', 'phoneNumber/phone', 'guardianPhone', 'contactEmail'
    ]
  });
}
