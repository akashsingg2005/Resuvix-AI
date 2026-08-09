import dotenv from 'dotenv';
dotenv.config();

import { generateCoverLetterAI } from '../src/services/ai.service.js';

async function runTests() {
    console.log("=== TEST 1: BANK MANAGER AT HDFC BANK ===");
    const res1 = await generateCoverLetterAI({
        jobTitle: "Bank Manager",
        companyName: "HDFC Bank",
        fullName: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "+91 9876543210",
        skills: "Branch Banking, Risk Compliance, Credit Analysis, Deposit Growth"
    });
    console.log(res1.content);

    console.log("\n=== TEST 2: MARKETING MANAGER AT NIKE ===");
    const res2 = await generateCoverLetterAI({
        jobTitle: "Marketing Manager",
        companyName: "Nike",
        fullName: "Priya Singh",
        email: "priya@example.com",
        skills: "Brand Strategy, Performance Marketing, Customer Acquisition, Social Media ROI"
    });
    console.log(res2.content);

    console.log("\n=== TEST 3: FRONTEND ENGINEER AT GOOGLE ===");
    const res3 = await generateCoverLetterAI({
        jobTitle: "Frontend Engineer",
        companyName: "Google",
        fullName: "Akash Kumar",
        email: "akash@example.com",
        skills: "React.js, TypeScript, Web Performance, Component Design"
    });
    console.log(res3.content);
}

runTests().catch(console.error);
