import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (email, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || '"Librync Hub" <no-reply@librync.io>',
      to: email,
      subject,
      html,
    });
    console.log(`[MAILER] Successfully sent email to: ${email}`);
    console.log("Response:", info);
    return { success: true };
  } catch (error) {
    console.error(`[MAILER] Failed to send email to: ${email}`, error);
    return { success: false, error };
  }
};

sendMail("sandeep08611@gmail.com", "Test Mail", "<h1>Hello</h1>").then(res => {
    console.log("Result:", res);
    process.exit(res.success ? 0 : 1);
});
