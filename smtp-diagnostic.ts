import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function diagnostic() {
    console.log('--- SMTP Diagnostic ---');
    console.log('User:', process.env.SMTP_USER);
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('Pass length:', process.env.SMTP_PASS?.length);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        debug: true,
        logger: true,
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');
    } catch (error: any) {
        console.error('❌ Connection failed:');
        console.error(error);

        if (error.code === 'EAUTH') {
            console.log('\n--- HINT ---');
            console.log('Authentication failed. This usually means:');
            console.log('1. The App Password is wrong (ensure no spaces).');
            console.log('2. 2-Step Verification is not enabled on your Google account.');
            console.log('3. You are using your normal account password instead of an App Password.');
        }
    }
}

diagnostic();
