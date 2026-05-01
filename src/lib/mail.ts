import crypto from "crypto";

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Simple mail utility. 
 * In development, it logs to the console.
 * In production, this should be replaced with a real provider like Resend, Nodemailer, or SendGrid.
 */
export async function sendEmail(options: MailOptions): Promise<void> {
  const { to, subject, text, html } = options;

  if (process.env.NODE_ENV === "development") {
    console.log("--------------------------------------------------");
    console.log(`📧 SENDING EMAIL TO: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    if (html) {
      console.log(`HTML: ${html}`);
    }
    console.log("--------------------------------------------------");
    return;
  }

  // TODO: Implement real email provider here
  throw new Error("Email provider not configured for production");
}

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
