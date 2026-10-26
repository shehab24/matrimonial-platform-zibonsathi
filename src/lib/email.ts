import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@zibonsathi.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "জীবনসাথী - ইমেইল যাচাই করুন",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1a5276">জীবনসাথীতে স্বাগতম</h2>
        <p>আপনার ইমেইল যাচাই করতে নিচের লিংকে ক্লিক করুন:</p>
        <a href="${url}" style="background:#1a5276;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">ইমেইল যাচাই করুন</a>
        <p style="color:#666;font-size:14px">লিংকটি ২৪ ঘণ্টা পর মেয়াদোত্তীর্ণ হয়ে যাবে।</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "জীবনসাথী - পাসওয়ার্ড রিসেট",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1a5276">পাসওয়ার্ড রিসেট</h2>
        <p>আপনার পাসওয়ার্ড রিসেট করতে নিচের লিংকে ক্লিক করুন:</p>
        <a href="${url}" style="background:#1a5276;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">পাসওয়ার্ড রিসেট করুন</a>
        <p style="color:#666;font-size:14px">লিংকটি ১ ঘণ্টা পর মেয়াদোত্তীর্ণ হয়ে যাবে।</p>
      </div>
    `,
  });
}
