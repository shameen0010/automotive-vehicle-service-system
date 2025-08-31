import nodemailer from 'nodemailer';

import { MailtrapTransport } from 'mailtrap';

const buildTransport = () => {
  // Use Mailtrap if token is provided
  if (process.env.MAILTRAP_TOKEN) {
    console.log('📧 Using Mailtrap for email sending');
    return nodemailer.createTransport(
      MailtrapTransport({
        token: process.env.MAILTRAP_TOKEN,
      })
    );
  }

  // Fallback to SMTP if configured
  if (process.env.SMTP_HOST) {
    console.log('📧 Using SMTP for email sending');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }

  // Dev mode - log to console
  console.log('📧 DEV MODE - Email will be logged to console');
  return null;
};

export async function sendMail({ to, subject, text, html }) {
  const transport = buildTransport();

  if (!transport) {
    console.log(`📧 DEV EMAIL → To:${to} | Subject: ${subject}`);
    console.log(`📧 Content: ${text || html}`);
    return;
  }

  try {
    const sender = {
      address: process.env.FROM_EMAIL || "noreply@autoelite.com",
      name: "Auto Elite Service",
    };

    const result = await transport.sendMail({
      from: sender,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      category: "Password Reset",
    });

    console.log(`📧 Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);

    // Fallback: Log OTP to console for testing
    console.log(`🔄 FALLBACK: Email failed, logging OTP to console`);
    console.log(`📧 DEV EMAIL → To:${to} | Subject: ${subject}`);
    console.log(`📧 Content: ${text || html}`);
    console.log(`✅ OTP is visible above - use it to test password reset!`);

    // Don't throw error - let the password reset continue
    return { fallback: true };
  }
}

// Test SMTP connection
export async function testSMTPConnection() {
  console.log('🔧 Testing SMTP connection...');

  if (!process.env.SMTP_HOST) {
    console.log('❌ SMTP_HOST not configured');
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Test the connection
    const result = await transport.verify();
    console.log('✅ SMTP connection successful!');
    console.log('📧 SMTP User:', process.env.SMTP_USER);
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('🔧 Possible issues:');
    console.error('   - Invalid username/password');
    console.error('   - 2FA enabled (use app password)');
    console.error('   - SMTP server blocking connection');
    console.error('   - Firewall/network issues');
    return false;
  }


const buildTransport = () => {
  if (!process.env.SMTP_HOST) return null; // dev mode
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
};

export async function sendMail({ to, subject, text, html }) {
  const t = buildTransport();
  if (!t) {
    console.log(`DEV EMAIL → To:${to} | ${subject}\n${text || html}`);
    return;
  }
  await t.sendMail({ from: process.env.FROM_EMAIL, to, subject, text, html });

}
