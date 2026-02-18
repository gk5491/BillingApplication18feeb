# 📧 SMTP Email System - Quick Start

✅ **Email dependencies installed successfully!**

Follow these simple steps to start sending emails through your organization's SMTP server.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Your Email Settings

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

**For Gmail (Most Common):**

1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Create an App Password for "Mail"
4. Update your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx

EMAIL_FROM_NAME=Your Company Name
ORGANIZATION_NAME=Your Company Name
ORGANIZATION_PHONE=+1 (555) 123-4567
ORGANIZATION_WEBSITE=https://yourcompany.com
ORGANIZATION_ADDRESS=123 Business St, City, State 12345
```

**⚠️ Important:** Use App Password (16 characters), NOT your regular Gmail password!

---

### Step 2: Initialize Email Services in Your Server

Update `server/index.ts`:

```typescript
import { EmailProviderAdapter } from './src/services/emailProviderAdapter';
import { EmailQueue } from './src/services/emailQueue';
import transactionEmailRouter from './src/api/transactionEmail';
import emailTestRouter from './src/api/emailTest';

// Initialize email services (add after database connection)
EmailProviderAdapter.initialize();
EmailQueue.initialize();

// Verify SMTP connection
await EmailProviderAdapter.verify();

// Register routes (add with other routes)
app.use('/api/transactions', transactionEmailRouter);
app.use('/api/email', emailTestRouter);
```

---

### Step 3: Test Your Email Configuration

**Option A: Using cURL**

```bash
# Test SMTP connection
curl -X POST http://localhost:3000/api/email/verify

# Send test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"recipient": "your-email@example.com"}'
```

**Option B: Using Browser/Postman**

```
POST http://localhost:3000/api/email/test
Content-Type: application/json

{
  "recipient": "your-email@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<unique-id>",
  "recipient": "your-email@example.com",
  "sentAt": "2026-01-06T10:30:00.000Z"
}
```

---

## 📨 Sending Invoice Emails (Example)

Once configured, you can send transaction emails:

```typescript
// In your invoice controller
import { EmailTriggerService } from './services/emailTriggerService';

// Send invoice email
await EmailTriggerService.createTrigger(
  {
    transactionType: 'invoice',
    transactionId: invoice.id,
    customerId: invoice.customerId,
    recipients: ['contact_person_id'],
    includePdf: true,
    includePaymentLink: true,
    sendMode: 'immediate',
    userId: req.user.id,
  },
  {
    customerId: invoice.customerId,
    transaction: invoice,
    customer: customer,
  }
);
```

**Frontend Usage:**

```typescript
// Send email from React component
const sendInvoiceEmail = async (invoiceId: string, recipients: string[]) => {
  const response = await fetch(`/api/transactions/invoice/${invoiceId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients,
      includePdf: true,
      includePaymentLink: true,
      sendMode: 'immediate',
    }),
  });
  
  const result = await response.json();
  console.log('Email sent:', result);
};
```

---

## 🔧 Common SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password-here
```

### Outlook / Office 365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Custom Domain (cPanel/Plesk)
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

---

## 🐛 Troubleshooting

### "Connection refused"
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify firewall allows outbound connections on port 587

### "Authentication failed"
- For Gmail: Use App Password, not regular password
- Verify `SMTP_USER` and `SMTP_PASS` are correct

### "Self-signed certificate"
- Add to `.env`: `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only)

### Emails going to spam
- Configure SPF, DKIM, and DMARC records for your domain
- Use a professional email address (not Gmail for business emails)

---

## 📊 Check Email Queue Status

```bash
curl http://localhost:3000/api/email/queue/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "waiting": 0,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0,
    "total": 155
  }
}
```

---

## 📚 Complete Documentation

For detailed setup guides and advanced configuration:

- **[SMTP_SETUP_GUIDE.md](./SMTP_SETUP_GUIDE.md)** - Complete SMTP configuration guide
- **[CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md](./CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md)** - Full system documentation
- **[EMAIL_SYSTEM_IMPLEMENTATION_GUIDE.md](./EMAIL_SYSTEM_IMPLEMENTATION_GUIDE.md)** - Implementation steps

---

## ✅ Setup Checklist

- [x] Dependencies installed (`npm install` completed)
- [ ] `.env` file created with SMTP credentials
- [ ] Email services initialized in server
- [ ] SMTP connection verified (`/api/email/verify`)
- [ ] Test email sent successfully (`/api/email/test`)
- [ ] Email received in inbox (not spam)
- [ ] Organization details configured in `.env`

---

## 🆘 Need Help?

1. **Check logs:** Look for error messages in console
2. **Verify `.env`:** Double-check SMTP settings
3. **Test connection:** Use `/api/email/verify` endpoint
4. **Review guide:** See [SMTP_SETUP_GUIDE.md](./SMTP_SETUP_GUIDE.md)

---

**Ready to send emails! 🎉**

Start your server with `npm run dev` and test the email functionality.
