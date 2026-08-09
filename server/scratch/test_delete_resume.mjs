import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Resume from '../src/models/resume.model.js';
import User from '../src/models/user.model.js';
import { deleteResumeService } from '../src/services/resume.service.js';

async function testDelete() {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);

    let testUser = await User.findOne({ email: "testdelete@example.com" });
    if (!testUser) {
        testUser = await User.create({
            fullName: "Test Delete User",
            email: "testdelete@example.com",
            password: "hashedpassword123",
            isEmailVerified: true
        });
    }

    const testResume = await Resume.create({
        user: testUser._id,
        title: "Test Delete Resume",
        template: "modern",
        personalInfo: { fullName: "Test User", email: "testdelete@example.com" }
    });

    console.log(`Created test resume with ID: ${testResume._id}`);

    await deleteResumeService(testResume._id, testUser._id);
    console.log(`Successfully deleted test resume with ID: ${testResume._id}`);

    const check = await Resume.findById(testResume._id);
    console.log(`Verification lookup: ${check ? 'FAILED (still exists)' : 'SUCCESS (deleted from DB)'}`);

    await mongoose.disconnect();
}

testDelete().catch(console.error);
