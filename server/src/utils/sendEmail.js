import nodemailer from "nodemailer";

const getTransporter = () => {
    if (process.env.MAIL_HOST && process.env.MAIL_HOST.includes("gmail")) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: { rejectUnauthorized: false }
        });
    }

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls: { rejectUnauthorized: false }
    });
};

export const sendEmail = async ({ to, subject, html }) => {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: process.env.MAIL_FROM || `"Resuvix AI" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    });
};

export default sendEmail;