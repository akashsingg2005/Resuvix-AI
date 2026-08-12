import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);

// Helper to resolve a hostname to its first IPv4 address
const getIPv4Host = async (host) => {
    if (/^[0-9.]+$/.test(host)) return host;
    try {
        const ips = await resolve4(host);
        if (ips && ips.length > 0) {
            return ips[0];
        }
    } catch (e) {
        console.warn(`⚠️ DNS resolve4 failed for ${host}, using hostname:`, e.message);
    }
    return host;
};

export const sendEmail = async ({ to, subject, html }) => {
    const host = (process.env.MAIL_HOST || "smtp.gmail.com").trim();
    const port = Number(process.env.MAIL_PORT) || 587;
    const user = (process.env.MAIL_USER || "").trim();
    const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "");

    // 1. Resolve host to IPv4 address dynamically to bypass IPv6 ENETUNREACH errors
    const ipv4Host = await getIPv4Host(host);

    // 2. Configure transporter with the resolved IPv4 address and SNI servername
    const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");
    const actualHost = isGmail ? await getIPv4Host("smtp.gmail.com") : ipv4Host;
    const actualPort = isGmail ? 465 : port;
    const isSecure = isGmail ? true : (actualPort === 465);

    const transporter = nodemailer.createTransport({
        host: actualHost,
        port: actualPort,
        secure: isSecure,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false,
            servername: isGmail ? "smtp.gmail.com" : host // Crucial for TLS handshake certificate validation
        }
    });

    const from = process.env.MAIL_FROM || `"Resuvix AI" <${process.env.MAIL_USER}>`;

    try {
        const info = await transporter.sendMail({ from, to, subject, html });
        console.log(`✉️ Email sent to ${to} (${info.messageId})`);
        return info;
    } catch (error) {
        console.error("❌ Nodemailer sendEmail Error:", error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};

export default sendEmail;