import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Gender, MaritalStatus, ProfileStatus } from '@prisma/client';
import { assignBiodataId } from '@/lib/biodata-id';

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
  if (lower.includes('male') || lower.includes('পুরুষ') || lower.includes('ছেলে')) return 'MALE';
  if (lower.includes('female') || lower.includes('মহিলা') || lower.includes('নারী') || lower.includes('মেয়ে')) return 'FEMALE';
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

    // Create a placeholder user for this imported biodata
    // Using a unique identifier based on timestamp + random
    const uniqueId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const placeholderEmail = `${uniqueId}@import.zibonsathi.local`;

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create placeholder user
      const user = await tx.user.create({
        data: {
          email: placeholderEmail,
          name: data.displayName || data.name || 'Imported Biodata',
          emailVerified: null,
          // Mark as imported
        },
      });

      // Create profile
      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          status: ProfileStatus.PENDING_APPROVAL,
          
          // Basic
          displayName: data.displayName || data.name || null,
          dateOfBirth: parseDate(data.dateOfBirth || data.dob),
          gender: gender,
          religion: data.religion || 'ইসলাম',
          sect: data.sect || null,

          // Location
          country: data.country || 'বাংলাদেশ',
          division: data.division || null,
          district: data.district || null,
          upazila: data.upazila || data.area || null,

          // Education & Occupation
          education: data.education || null,
          educationDetails: data.educationDetails || data.educationDetail || null,
          occupation: data.occupation || data.job || null,
          occupationDetails: data.occupationDetails || data.occupationDetail || null,
          monthlyIncome: data.monthlyIncome || data.income || null,

          // Marital & Family
          maritalStatus: parseMaritalStatus(data.maritalStatus),
          numberOfChildren: parseInteger(data.numberOfChildren || data.children),
          fatherAlive: parseBoolean(data.fatherAlive || data.father),
          motherAlive: parseBoolean(data.motherAlive || data.mother),
          siblings: parseInteger(data.siblings || data.brothersSisters),
          familyType: data.familyType || null,
          familyStatus: data.familyStatus || data.familyCondition || null,

          // Religious
          prayerHabit: data.prayerHabit || data.prayer || null,
          beardOrHijab: data.beardOrHijab || data.beard || data.hijab || null,
          mazhab: data.mazhab || data.madhab || null,

          // About & Preferences
          aboutMe: data.aboutMe || data.about || data.bio || null,
          partnerPreferences: data.partnerPreferences || data.lookingFor || data.preference || null,

          // Contact
          phoneNumber: data.phoneNumber || data.phone || data.mobile || null,
          guardianPhone: data.guardianPhone || data.guardianMobile || null,

          // Admin note
          adminNote: `Imported via API on ${new Date().toISOString()}. Source: ${data.source || 'n8n/telegram'}`,
        },
      });

      // Assign biodata ID
      const biodataId = await assignBiodataId(profile.id);
      
      // Update profile with biodata ID
      await tx.profile.update({
        where: { id: profile.id },
        data: { oderId: biodataId },
      });

      return { user, profile, biodataId };
    });

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
      'aboutMe/bio', 'partnerPreferences/lookingFor', 'phoneNumber/phone', 'guardianPhone'
    ]
  });
}
