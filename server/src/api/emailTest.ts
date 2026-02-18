/**
 * Email Testing API Routes
 * 
 * Test SMTP configuration and send test emails
 */

import { Router, Request, Response } from 'express';
import { EmailProviderAdapter } from '../services/emailProviderAdapter';
import { EmailQueue } from '../services/emailQueue';

const router = Router();

// =====================================================
// POST /api/email/test
// Send test email to verify SMTP configuration
// =====================================================

router.post('/test', async (req: Request, res: Response) => {
  try {
    // Manually extract recipient from body
    const recipient = ((req.body as any)?.recipient as string) || "";
    
    console.log('Sending test email to:', recipient);
    console.log('Request body:', req.body);

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required in the request body',
        debug: {
          body: req.body,
          headers: req.headers
        }
      });
    }

    // Initialize email provider if not already done
    EmailProviderAdapter.initialize();
    
    // Send test email
    const result = await EmailProviderAdapter.send({
      to: [recipient as string],
      subject: '✅ SMTP Test Email - Billing System',
      html: `
        <h1>Email Configuration Test</h1>
        <p>Congratulations! Your SMTP configuration is working correctly.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>From: ${process.env.SMTP_USER}</li>
        </ul>
        <p>This email was sent at: ${new Date().toLocaleString()}</p>
      `,
      text: `
Email Configuration Test

Congratulations! Your SMTP configuration is working correctly.

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From: ${process.env.SMTP_USER}

This email was sent at: ${new Date().toLocaleString()}
      `,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      recipient,
      sentAt: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Test email failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
      hint: 'Check your SMTP configuration in your settings. If using Gmail, ensure you use an App Password.',
    });
  }
});

// =====================================================
// POST /api/email/verify
// Verify SMTP connection without sending email
// =====================================================

router.post('/verify', async (req: Request, res: Response) => {
  try {
    EmailProviderAdapter.initialize();
    const isValid = await EmailProviderAdapter.verify();
    
    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'SMTP connection verified successfully',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          secure: process.env.SMTP_SECURE === 'true',
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'SMTP connection failed',
        hint: 'Check your SMTP credentials. If using Gmail, ensure you use an App Password and that 2-Step Verification is enabled.',
      });
    }
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env',
    });
  }
});

// =====================================================
// GET /api/email/queue/stats
// Get email queue statistics
// =====================================================

router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      stats: { message: 'Stats tracking not yet implemented' },
    });
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
