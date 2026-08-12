import nodemailer from "nodemailer";
import env from "../config/env.js";

import dns from "dns";

const getTransporter = () => {
    const host = (env.MAIL_HOST || process.env.MAIL_HOST || "smtp.gmail.com").trim();
    const port = Number(env.MAIL_PORT || process.env.MAIL_PORT) || 587;
    const user = (env.MAIL_USER || process.env.MAIL_USER || "").trim();
    const pass = (env.MAIL_PASS || process.env.MAIL_PASS || "").replace(/\s+/g, "");

    const lookupOption = (hostname, options, callback) => {
        return dns.lookup(hostname, { family: 4 }, callback);
    };

    if (host.includes("gmail") || user.endsWith("@gmail.com")) {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            lookup: lookupOption
        });
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        lookup: lookupOption
    });
};

export const sendMail = async ({ to, subject, html }) => {
    const transporter = getTransporter();
    const fromAddress = env.MAIL_FROM || process.env.MAIL_FROM || `"Resuvix AI" <${env.MAIL_USER || process.env.MAIL_USER}>`;

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });
        console.log(`✉️ Email successfully sent to ${to} (Message ID: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error("❌ Nodemailer sendMail Error:", error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};