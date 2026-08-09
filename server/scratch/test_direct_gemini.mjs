import dotenv from 'dotenv';
dotenv.config();

import env from '../src/config/env.js';

async function testDirectGeminiCall() {
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey, "Key length:", apiKey ? apiKey.length : 0);

    const prompt = `Write a short 3-paragraph cover letter for Rahul Sharma applying for Bank Manager at HDFC Bank. Return raw JSON with schema: {"content": "..."}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        console.log("HTTP Status:", response.status, response.statusText);
        const data = await response.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Direct fetch exception:", e);
    }
}

testDirectGeminiCall();
