import { Resend } from "resend";
import env from "../config/env.js";

// Fallback: use Nodemailer as backup if Resend key is not set
import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);

const getResendClient = () => {
    const key = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!key) return null;
    return new Resend(key);
};

const getIPv4Host = async (host) => {
    if (/^[0-9.]+$/.test(host)) return host;
    try {
        const ips = await resolve4(host);
        if (ips && ips.length > 0) return ips[0];
    } catch (e) {
        console.warn(`⚠️ DNS resolve4 failed for ${host}:`, e.message);
    }
    return host;
};

const sendViaNodemailer = async ({ to, subject, html }) => {
    const host = (env.MAIL_HOST || process.env.MAIL_HOST || "smtp.gmail.com").trim();
    const port = Number(env.MAIL_PORT || process.env.MAIL_PORT) || 587;
    const user = (env.MAIL_USER || process.env.MAIL_USER || "").trim();
    const pass = (env.MAIL_PASS || process.env.MAIL_PASS || "").replace(/\s+/g, "");
    const from = env.MAIL_FROM || process.env.MAIL_FROM || `"Resuvix AI" <${user}>`;

    const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");
    const actualHost = isGmail ? await getIPv4Host("smtp.gmail.com") : await getIPv4Host(host);
    const actualPort = isGmail ? 465 : port;

    const transporter = nodemailer.createTransport({
        host: actualHost,
        port: actualPort,
        secure: actualPort === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false, servername: isGmail ? "smtp.gmail.com" : host }
    });

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`✉️ [Nodemailer] Email sent to ${to} (${info.messageId})`);
    return info;
};

export const sendMail = async ({ to, subject, html }) => {
    const resend = getResendClient();

    // PRIMARY: Use Resend (HTTPS API, not blocked by Render)
    if (resend) {
        const fromAddress = env.RESEND_FROM || process.env.RESEND_FROM || "Resuvix AI <onboarding@resend.dev>";
        try {
            const { data, error } = await resend.emails.send({
                from: fromAddress,
                to,
                subject,
                html,
            });
            if (error) throw new Error(error.message);
            console.log(`✉️ [Resend] Email sent to ${to} (ID: ${data?.id})`);
            return data;
        } catch (error) {
            console.error("❌ Resend Error:", error.message);
            throw new Error(`Email delivery failed: ${error.message}`);
        }
    }

    // FALLBACK: Use Nodemailer (may fail on Render if SMTP ports blocked)
    console.warn("⚠️ RESEND_API_KEY not set, falling back to Nodemailer...");
    return sendViaNodemailer({ to, subject, html });
};