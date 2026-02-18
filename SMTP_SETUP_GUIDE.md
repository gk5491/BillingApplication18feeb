# SMTP Email Setup Guide

This guide will help you configure SMTP email sending for your billing application.

---

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
npm install nodemailer @types/nodemailer handlebars bull @types/bull
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and update with your SMTP credentials:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-organization-email@gmail.com
SMTP_PASS=your-app-password

# Organization Details
EMAIL_FROM_NAME=Your Company Name
ORGANIZATION_NAME=Your Company Name
ORGANIZATION_PHONE=+1 (555) 123-4567
ORGANIZATION_WEBSITE=https://yourcompany.com
ORGANIZATION_ADDRESS=123 Business St, City, State 12345
```

### Step 3: Initialize Services

Update your main server file (`server/index.ts` or `server/src/app.ts`):

```typescript
import { EmailProviderAdapter } from './services/emailProviderAdapter';
import { EmailQueue } from './services/emailQueue';
import emailTestRouter from './api/emailTest';

// Initialize email services
EmailProviderAdapter.initialize();
EmailQueue.initialize();

// Verify SMTP connection
EmailProviderAdapter.verify();

// Register email test routes
app.use('/api/email', emailTestRouter);
```

### Step 4: Test Email Configuration

Send a test email to verify your setup:

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"recipient": "your-email@example.com"}'
```

Or verify connection without sending:

```bash
curl -X POST http://localhost:3000/api/email/verify
```

---

## 📧 SMTP Provider Configuration

### Gmail

**Setup Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Create an "App Password" for "Mail"
4. Use the 16-character password in your `.env`

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # 16-char app password
```

**Note:** Do NOT use your regular Gmail password. Always use App Passwords.

---

### Outlook / Office 365

**Configuration:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**For Office 365 Business:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
```

---

### Yahoo Mail

**Setup Steps:**
1. Enable 2-Factor Authentication
2. Generate App Password in Account Security settings

**Configuration:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

---

### Zoho Mail

**Configuration:**
```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@zoho.com
SMTP_PASS=your-password
```

---

### Custom SMTP Server (cPanel, Plesk, etc.)

**Configuration:**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # true if using port 465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
```

**Common Ports:**
- **587** - TLS (recommended)
- **465** - SSL (set `SMTP_SECURE=true`)
- **25** - Plain (not recommended, often blocked)

---

## 🧪 Testing Your Setup

### 1. Verify SMTP Connection

```bash
curl -X POST http://localhost:3000/api/email/verify
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMTP connection verified successfully",
  "config": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "your-email@gmail.com",
    "secure": false
  }
}
```

### 2. Send Test Email

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"recipient": "test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<unique-message-id>",
  "recipient": "test@example.com",
  "sentAt": "2026-01-06T10:30:00.000Z"
}
```

### 3. Check Queue Statistics

```bash
curl http://localhost:3000/api/email/queue/stats
```

---

## 🔧 Troubleshooting

### Error: "Connection refused"

**Cause:** SMTP server not reachable or wrong host/port.

**Solution:**
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Check firewall settings
- Try ping/telnet to SMTP server

```bash
telnet smtp.gmail.com 587
```

---

### Error: "Authentication failed"

**Cause:** Invalid credentials or app password not used.

**Solution:**
- For Gmail: Use App Password, not regular password
- For other providers: Verify username and password
- Check if "Less secure app access" needs to be enabled

---

### Error: "TLS handshake failed"

**Cause:** SSL/TLS configuration issue.

**Solution:**
- For port 587: Set `SMTP_SECURE=false`
- For port 465: Set `SMTP_SECURE=true`
- Add to .env: `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only)

---

### Error: "Sender address rejected"

**Cause:** SMTP server doesn't allow sending from your email.

**Solution:**
- Verify `SMTP_USER` matches your authenticated email
- Check SPF/DKIM records for custom domains
- Contact your email provider

---

### Emails Going to Spam

**Solutions:**
1. **SPF Record:** Add to DNS:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM:** Configure in your email provider settings

3. **DMARC:** Add to DNS:
   ```
   v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
   ```

4. **Content:** Avoid spam trigger words, include unsubscribe link

---

## 📊 Monitoring Email Delivery

### Check Queue Status

```typescript
const stats = await EmailQueue.getStats();
console.log(stats);
// {
//   waiting: 0,
//   active: 2,
//   completed: 150,
//   failed: 3,
//   delayed: 0,
//   total: 155
// }
```

### View Email Audit Logs

```sql
SELECT 
  ea.id,
  ea.status,
  ea.to_addresses,
  ea.subject,
  ea.sent_at,
  ea.error_message
FROM email_audits ea
WHERE ea.status = 'failed'
ORDER BY ea.created_at DESC
LIMIT 10;
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use App Passwords** - Don't use main email passwords
3. **Rotate credentials** - Change SMTP passwords regularly
4. **Limit rate** - Respect provider sending limits
5. **Monitor bounces** - Track and handle bounce notifications
6. **SSL/TLS** - Always use encrypted connections

---

## 📈 Sending Limits

**Gmail:**
- Free: 500 emails/day
- Google Workspace: 2,000 emails/day

**Outlook:**
- Free: 300 emails/day
- Office 365: 10,000 emails/day

**Yahoo:**
- Free: 500 emails/day

**Custom SMTP:**
- Check with your provider

**If you need higher limits:**
- Use transactional email service (SendGrid, AWS SES, Mailgun)
- Contact your email provider for business plans

---

## 🚀 Production Deployment

### Environment Setup

```bash
# Production .env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=strong-password-here

# Redis (required for queue)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
# Or
REDIS_URL=redis://user:pass@host:port

NODE_ENV=production
```

### Start Services

```bash
# Start Redis
redis-server

# Start application
npm run start
```

### PM2 Setup (Recommended)

```bash
npm install -g pm2

# Start with PM2
pm2 start npm --name "billing-app" -- start

# Monitor
pm2 monit

# Logs
pm2 logs billing-app
```

---

## 📝 Usage in Your Application

### Send Invoice Email

```typescript
import { EmailTriggerService } from './services/emailTriggerService';

// Send invoice
await EmailTriggerService.createTrigger(
  {
    transactionType: 'invoice',
    transactionId: 'INV-001',
    customerId: 'CUST-001',
    recipients: ['contact_id_1'],
    includePdf: true,
    includePaymentLink: true,
    sendMode: 'immediate',
    userId: 'user_123',
  },
  {
    customerId: 'CUST-001',
    transaction: invoiceData,
    customer: customerData,
  }
);
```

---

## ✅ Setup Checklist

- [ ] Install nodemailer dependencies
- [ ] Create `.env` file with SMTP credentials
- [ ] Initialize EmailProviderAdapter in server
- [ ] Initialize EmailQueue in server
- [ ] Test SMTP connection (`/api/email/verify`)
- [ ] Send test email (`/api/email/test`)
- [ ] Verify email received in inbox
- [ ] Check email not in spam
- [ ] Configure organization details in `.env`
- [ ] Set up Redis for production
- [ ] Configure monitoring and alerts

---

## 🆘 Support

If you encounter issues:

1. Check logs: `pm2 logs billing-app` or console output
2. Verify `.env` configuration
3. Test with `/api/email/verify` endpoint
4. Check email provider documentation
5. Review error messages in email_audits table

---

**Email system is now ready to send emails through your organization's SMTP server!** 🎉
