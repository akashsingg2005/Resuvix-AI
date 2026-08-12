import env from "../config/env.js";

// ===================================================================
// EMAIL SERVICE — Uses Brevo (HTTPS API, not blocked by Render)
// Fallback: Resend if BREVO_API_KEY not set
// ===================================================================

const sendViaBrevo = async ({ to, subject, html }) => {
    const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    const senderEmail = env.MAIL_USER || process.env.MAIL_USER || "akashsingg23@gmail.com";
    const senderName = "Resuvix AI";

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": apiKey,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent: html
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Brevo API error (${response.status})`);
    }

    console.log(`✉️ [Brevo] Email sent to ${to} (Message ID: ${data.messageId})`);
    return data;
};

const sendViaResend = async ({ to, subject, html }) => {
    const { Resend } = await import("resend");
    const resend = new Resend(env.RESEND_API_KEY || process.env.RESEND_API_KEY);
    const fromAddress = env.RESEND_FROM || process.env.RESEND_FROM || "Resuvix AI <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({ from: fromAddress, to, subject, html });
    if (error) throw new Error(error.message);

    console.log(`✉️ [Resend] Email sent to ${to} (ID: ${data?.id})`);
    return data;
};

export const sendMail = async ({ to, subject, html }) => {
    const brevoKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    const resendKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    try {
        // PRIMARY: Brevo — no domain verification needed, sends to any email
        if (brevoKey) {
            return await sendViaBrevo({ to, subject, html });
        }

        // SECONDARY: Resend — needs domain verified for non-owner emails
        if (resendKey) {
            console.warn("⚠️  Using Resend — only owner email receives OTP in test mode");
            return await sendViaResend({ to, subject, html });
        }

        throw new Error("No email provider configured. Set BREVO_API_KEY or RESEND_API_KEY.");
    } catch (error) {
        console.error("❌ Email delivery failed:", error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};