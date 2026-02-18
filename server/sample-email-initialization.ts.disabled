/**
 * Sample Server Initialization with Email System
 * 
 * Add this code to your server/index.ts or server/src/app.ts
 */

import express from 'express';
import { EmailProviderAdapter } from './src/services/emailProviderAdapter';
import { EmailQueue } from './src/services/emailQueue';
import transactionEmailRouter from './src/api/transactionEmail';
import emailTestRouter from './src/api/emailTest';

const app = express();

// ... your existing middleware (body parser, cors, etc.)

// =====================================================
// EMAIL SYSTEM INITIALIZATION
// =====================================================

console.log('🔧 Initializing email system...');

// Initialize SMTP Email Provider
EmailProviderAdapter.initialize();

// Initialize Email Queue (requires Redis)
EmailQueue.initialize();

// Verify SMTP connection (optional but recommended)
EmailProviderAdapter.verify()
  .then(success => {
    if (success) {
      console.log('✅ Email system ready - SMTP connection verified');
      console.log(`📧 Sending from: ${process.env.SMTP_USER}`);
    } else {
      console.error('❌ Email system failed - SMTP connection could not be verified');
      console.error('   Check your SMTP settings in .env file');
    }
  })
  .catch(error => {
    console.error('❌ Email system error:', error.message);
    console.error('   Make sure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env');
  });

// =====================================================
// EMAIL API ROUTES
// =====================================================

// Transaction email routes (send invoice/estimate emails)
app.use('/api/transactions', transactionEmailRouter);

// Email testing routes (verify SMTP, send test emails)
app.use('/api/email', emailTestRouter);

// =====================================================
// ... rest of your routes and server setup
// =====================================================

export default app;


// =====================================================
// TESTING YOUR EMAIL CONFIGURATION
// =====================================================
/*

After starting your server, test the email system:

1. Verify SMTP connection:
   curl -X POST http://localhost:3000/api/email/verify

2. Send test email:
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"recipient": "your-email@example.com"}'

3. Check queue statistics:
   curl http://localhost:3000/api/email/queue/stats

4. Send invoice email (example):
   curl -X POST http://localhost:3000/api/transactions/invoice/INV-001/email \
     -H "Content-Type: application/json" \
     -d '{
       "recipients": ["contact_id_123"],
       "includePdf": true,
       "includePaymentLink": true,
       "sendMode": "immediate"
     }'

*/
