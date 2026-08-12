import nodemailer from "nodemailer";

const getTransporter = () => {
    const host = (process.env.MAIL_HOST || "smtp.gmail.com").trim();
    const port = Number(process.env.MAIL_PORT) || 587;
    const user = (process.env.MAIL_USER || "").trim();
    const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "");

    if (host.includes("gmail") || user.endsWith("@gmail.com")) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });
};

export const sendEmail = async ({ to, subject, html }) => {
    const transporter = getTransporter();
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