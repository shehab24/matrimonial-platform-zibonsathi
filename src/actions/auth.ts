'use server';

import { prisma } from '@/lib/prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'লিঙ্গ নির্বাচন করুন' }),
});

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
}) {
  try {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existingUser) {
      return { success: false, error: 'এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট আছে' };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        profile: {
          create: {
            gender: parsed.data.gender,
            displayName: parsed.data.name,
          },
        },
        creditBalance: {
          create: { balance: 0 },
        },
      },
    });

    const tokenValue = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        token: tokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, tokenValue);

    return { success: true };
  } catch (error) {
    console.error('registerUser error:', error);
    return { success: false, error: 'নিবন্ধন ব্যর্থ হয়েছে, আবার চেষ্টা করুন' };
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন' };
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return { success: false, error: 'টোকেনের মেয়াদ শেষ হয়ে গেছে' };
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return { success: true };
  } catch (error) {
    console.error('verifyEmail error:', error);
    return { success: false, error: 'যাচাইকরণ ব্যর্থ হয়েছে' };
  }
}

export async function forgotPassword(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent email enumeration
      return { success: true };
    }

    const tokenValue = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        token: tokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(user.email, tokenValue);

    return { success: true };
  } catch (error) {
    console.error('forgotPassword error:', error);
    return { success: false, error: 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    if (password.length < 8) {
      return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' };
    }

    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: 'অবৈধ টোকেন' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: 'টোকেনের মেয়াদ শেষ হয়ে গেছে' };
    }

    if (resetToken.usedAt) {
      return { success: false, error: 'এই টোকেন ইতিমধ্যে ব্যবহার করা হয়েছে' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error('resetPassword error:', error);
    return { success: false, error: 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' };
  }
}
