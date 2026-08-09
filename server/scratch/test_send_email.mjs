import dotenv from 'dotenv';
dotenv.config();

import sendEmail from '../src/utils/sendEmail.js';

async function testEmail() {
    console.log("Testing Nodemailer SMTP email dispatch...");
    try {
        await sendEmail({
            to: "akashsingg23@gmail.com",
            subject: "Resuvix AI Test: Cover Letter Email Dispatch",
            html: `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #6C63FF;">🚀 Resuvix AI Cover Letter Dispatch Test</h2>
                    <p>This is a test verification email sent via Nodemailer SMTP.</p>
                </div>
            `
        });
        console.log("SUCCESS: Nodemailer test email dispatched cleanly!");
    } catch (e) {
        console.error("ERROR: Nodemailer failed:", e.message);
    }
}

testEmail();
