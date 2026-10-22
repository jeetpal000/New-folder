import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email is not configured. Set SMTP_USER and SMTP_PASS.");
  }

  try {
    const info = await transporter.sendMail({
      from: `"School ERP" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return {success: true, info};
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}