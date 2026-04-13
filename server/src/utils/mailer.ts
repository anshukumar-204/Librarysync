// Brevo API Logic (Bypasses SMTP blocks on Render via HTTP/443)
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendMail = async (email, subject, html) => {
  const apiKey = process.env.SMTP_PASS;
  const fromAddress = process.env.SENDER_EMAIL || "no-reply@librync.io";

  if (!apiKey) {
    console.error("[MAILER] Critical Error: SMTP_PASS (API Key) missing.");
    return { success: false, error: { message: "API Key missing", code: "MISSING_KEY" } };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Librync Hub", email: fromAddress },
        to: [{ email }],
        subject,
        htmlContent: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[MAILER] Brevo API Error: ${data.message || response.statusText}`);
      return {
        success: false,
        error: {
          message: data.message || "Brevo API Dispatch Failed",
          code: data.code || `HTTP_${response.status}`
        }
      };
    }

    console.log(`[MAILER] Brevo API dispatched successfully. MessageID: ${data.messageId} to: ${email}`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error(`[MAILER] Network Failure during API dispatch to: ${email}`);
    return { success: false, error: { message: error.message, code: error.code || "FETCH_ERR" } };
  }
};
