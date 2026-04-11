import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Simulation of the new logic in auth.controller.ts
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log(`[TEST] Initializing with user: ${user}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });

  return transporter;
};

const sendMail = async (email, subject, html) => {
  try {
    const mailer = getTransporter();
    const fromAddress = process.env.SENDER_EMAIL || "no-reply@librync.io";
    
    const info = await mailer.sendMail({
      from: `"Librync Hub" <${fromAddress}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[MAILER] Successfully dispatched email to: ${email}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[MAILER] Dispatch Failure to: ${email}`, error);
    return { success: false, error };
  }
};

sendMail("sandeep08611@gmail.com", "Verification Test", "<h1>System Refactor Verified</h1>").then(res => {
    console.log("Result:", res.success ? "SUCCESS" : "FAILED");
    process.exit(res.success ? 0 : 1);
});
