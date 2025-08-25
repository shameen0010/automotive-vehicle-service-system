import nodemailer from 'nodemailer';

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
