import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Settings anyone may read by key; everything else is admin-only
const PUBLIC_KEYS = ['whatsapp_number'];

// GET - fetch settings (public for whatsapp number)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key) {
    if (!PUBLIC_KEYS.includes(key)) {
      const session = await auth();
      if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });
    return NextResponse.json({ value: setting?.value || null });
  }

  // Return all settings (admin only)
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.siteSetting.findMany();
  const settingsObj = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return NextResponse.json(settingsObj);
}

// POST - update settings (admin only)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value: value || '' },
    create: { key, value: value || '' },
  });

  return NextResponse.json({ success: true, setting });
}
