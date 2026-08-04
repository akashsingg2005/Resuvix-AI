import nodemailer from "nodemailer";
import env from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: Number(env.MAIL_PORT),
    secure: false,
    auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
    },
});

export const sendMail = async ({
    to,
    subject,
    html,
}) => {

    await transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject,
        html,
    });

};