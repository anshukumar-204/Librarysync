import dotenv from "dotenv";
dotenv.config();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const testSendMail = async () => {
    const apiKey = process.env.SMTP_PASS;
    const fromAddress = process.env.SENDER_EMAIL;
    const toEmail = "sandeep08611@gmail.com";

    console.log(`[TEST] Using Sender: ${fromAddress}`);
    console.log(`[TEST] Target Recipient: ${toEmail}`);

    try {
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "x-sib-api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "Librync Hub (API Test)", email: fromAddress },
                to: [{ email: toEmail }],
                subject: "Brevo API Integration Test",
                htmlContent: "<h1>Success!</h1><p>The system is now using the Brevo HTTP API to bypass SMTP blocks.</p>"
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("SUCCESS: API dispatch successful.");
            console.log("Message ID:", data.messageId);
        } else {
            console.error("FAILED: API error.");
            console.error(JSON.stringify(data, null, 2));
            process.exit(1);
        }
    } catch (e) {
        console.error("CRITICAL: Network error during fetch.");
        console.error(e);
        process.exit(1);
    }
};

testSendMail();
