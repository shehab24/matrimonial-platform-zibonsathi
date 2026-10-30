import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  remember: z.enum(["true", "false"]).optional(),
});

const DAY = 24 * 60 * 60 * 1000;

const ACCOUNT_CHECK_TTL = 60 * 1000;
const accountCache = new Map<string, { at: number; state: { isSuspended: boolean; role: string } | "gone" }>();

/**
 * Current suspension/role for a signed-in user, cached briefly per server process.
 * Returns null when it can't be checked (edge runtime or DB error) so a hiccup never logs people out.
 */
async function getAccountState(userId: string) {
  if (process.env.NEXT_RUNTIME === "edge") return null;
  const cached = accountCache.get(userId);
  if (cached && Date.now() - cached.at < ACCOUNT_CHECK_TTL) return cached.state;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true, role: true } });
    const state = user ?? "gone";
    accountCache.set(userId, { at: Date.now(), state });
    return state;
  } catch (error) {
    console.error("account state check error:", error);
    return null;
  }
}

/** Google login is only offered once its OAuth credentials are configured */
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Case-insensitive so "Name@Mail.com" and "name@mail.com" are the same account
        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        });

        if (!user || !user.passwordHash) return null;
        if (user.isSuspended) throw new Error("ACCOUNT_SUSPENDED");
        // Email verification disabled until Resend is configured
        // if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          remember: parsed.data.remember !== "false",
        };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            // Google only returns verified emails, so linking to an existing account
            // registered with the same email is safe and avoids a dead-end error
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    // Accounts created through Google skip the register form, so give them a credit balance here
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.creditBalance.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: 0 },
        update: {},
      });
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      if (!profile?.email_verified) return false;
      // Suspended accounts can't get back in through Google either
      const existing = user.email
        ? await prisma.user.findUnique({ where: { email: user.email }, select: { isSuspended: true } })
        : null;
      return !existing?.isSuspended;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        // "Remember me" unticked keeps the session for 1 day instead of 30
        const remember = (user as { remember?: boolean }).remember !== false;
        token.sessionExpires = Date.now() + (remember ? 30 : 1) * DAY;
      }
      // Returning null ends the session once its remember-me window has passed
      if (typeof token.sessionExpires === "number" && Date.now() > token.sessionExpires) {
        return null;
      }
      // Sessions are JWTs, so suspension, deletion and role changes are re-read from the DB
      if (typeof token.id === "string") {
        const account = await getAccountState(token.id);
        if (account === "gone" || account?.isSuspended) return null;
        if (account) token.role = account.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
