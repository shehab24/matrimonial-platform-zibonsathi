'use server';

import { prisma } from '@/lib/prisma';
import { actionError, type ActionErrorKey } from '@/lib/action-error';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'nameMin'),
  email: z.string().trim().toLowerCase().email('invalidEmail'),
  password: z.string().min(8, 'passwordMin'),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'genderRequired' }),
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
      return { success: false, error: await actionError(parsed.error.issues[0].message as ActionErrorKey) };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: parsed.data.email, mode: 'insensitive' } },
    });
    if (existingUser) {
      return { success: false, error: await actionError('emailTaken') };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        // Email verification disabled until Resend is configured — auto-verify on signup
        emailVerified: new Date(),
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

    // Email verification disabled until Resend is configured
    // const tokenValue = crypto.randomBytes(32).toString('hex');
    // await prisma.verificationToken.create({
    //   data: {
    //     token: tokenValue,
    //     userId: user.id, // restore `const user =` above when re-enabling
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    //   },
    // });
    //
    // await sendVerificationEmail(user.email, tokenValue);

    return { success: true };
  } catch (error) {
    console.error('registerUser error:', error);
    return { success: false, error: await actionError('registerFailed') };
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: await actionError('invalidOrExpiredToken') };
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return { success: false, error: await actionError('tokenExpired') };
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return { success: true };
  } catch (error) {
    console.error('verifyEmail error:', error);
    return { success: false, error: await actionError('verifyFailed') };
  }
}

export async function forgotPassword(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
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
    return { success: false, error: await actionError('resetFailed') };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    if (password.length < 8) {
      return { success: false, error: await actionError('passwordMin') };
    }

    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: await actionError('invalidToken') };
    }

    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: await actionError('tokenExpired') };
    }

    if (resetToken.usedAt) {
      return { success: false, error: await actionError('tokenUsed') };
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
    return { success: false, error: await actionError('resetFailed') };
  }
}
