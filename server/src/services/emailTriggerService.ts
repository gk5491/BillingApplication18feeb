/**
 * Email Trigger Service - JSON Storage Version
 * 
 * Handles creation and processing of email triggers with guard middleware
 */

import { EmailQueue } from './emailQueue';
import { EmailTemplateRenderer } from './emailTemplateRenderer';
import { EmailDataService } from './emailDataService';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Helper to read core data from JSON
function readCoreData(filename: string, key: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data[key] || [];
  } catch (e) {
    return [];
  }
}

export interface CreateEmailTriggerRequest {
  transactionType?: 'invoice' | 'estimate' | 'sales_order' | 'credit_note' | 'payment';
  transactionId?: string;
  customerId: string;
  recipients: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
  templateId?: string;
  customSubject?: string;
  customBody?: string;
  sendMode: 'immediate' | 'scheduled';
  userId?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailGuard {
  static async validate(trigger: CreateEmailTriggerRequest, context: any): Promise<{ allowed: boolean, reason?: string }> {
    const customers = readCoreData('customers.json', 'customers');
    const customer = customers.find((c: any) => String(c.id) === String(trigger.customerId));

    if (!customer) return { allowed: false, reason: 'Customer not found' };
    if (customer.isActive === false) return { allowed: false, reason: 'Customer is inactive' };

    if (trigger.recipients.length === 0) return { allowed: false, reason: 'No recipients specified' };

    return { allowed: true };
  }
}

export class EmailTriggerService {
  static async createTrigger(request: CreateEmailTriggerRequest, context: any) {
    const guardResult = await EmailGuard.validate(request, context);
    if (!guardResult.allowed) {
      throw new Error(`Email blocked: ${guardResult.reason}`);
    }

    // Strip large attachments from the trigger object saved to JSON to prevent performance issues
    const triggerData = { ...request };
    if (triggerData.attachments) {
      triggerData.attachments = triggerData.attachments.map(a => ({
        ...a,
        content: `[REDACTED: ${a.content?.length || 0} bytes]` as any
      }));
    }

    // Save to database/JSON first
    const trigger = EmailDataService.saveTrigger(triggerData);

    if (request.sendMode === 'immediate') {
      // Use setTimeout with a 5000ms delay to give the server plenty of time to stabilize
      setTimeout(() => {
        console.log(`[EmailTriggerService] Background task started for trigger ${trigger.id} after extended delay`);
        this.processImmediateSend(trigger.id, request, context).catch(err => {
          console.error(`[EmailTriggerService] Background task failed for trigger ${trigger.id}:`, err.message);
        });
      }, 5000);
      return { triggerId: trigger.id };
    }

    return { triggerId: trigger.id };
  }

  private static async processImmediateSend(triggerId: string, request: CreateEmailTriggerRequest, context: any) {
    try {
      console.log(`[EmailTriggerService] Processing immediate send for trigger ${triggerId}`);
      // Resolve recipients
      const contacts = EmailDataService.getContactPersons(request.customerId);
      const recipients = contacts.filter((c: any) => request.recipients.includes(c.id));

      // If no specific contacts found, try using customer email directly if it was passed as ID or if recipients are emails
      let toEmails = recipients.length > 0 ? recipients.map((r: any) => r.email) : request.recipients.filter((r: any) => r.includes('@'));

      // Fallback: check if customer has email
      const customers = readCoreData('customers.json', 'customers');
      const customer = customers.find((c: any) => String(c.id) === String(request.customerId));

      if (toEmails.length === 0) {
        if (customer && customer.email) {
          toEmails.push(customer.email);
        } else {
          console.error('[EmailTriggerService] No valid recipient email addresses found for customer:', request.customerId);
          throw new Error('No valid recipient email addresses found');
        }
      }

      console.log(`[EmailTriggerService] Rendering template for ${toEmails.join(', ')}`);
      const content = await EmailTemplateRenderer.render({
        templateId: request.templateId,
        context: {
          transaction: context.transaction,
          customer: context.customer || customer,
          contact: recipients[0] || { name: context.customer?.displayName || customer?.displayName || 'Customer' }
        },
        customSubject: request.customSubject,
        customBody: request.customBody,
      });

      console.log(`[EmailTriggerService] Saving audit for trigger ${triggerId}`);
      const audit = EmailDataService.saveAudit({
        triggerId,
        toAddresses: JSON.stringify(toEmails),
        subject: content.subject,
        status: 'queued',
        attempts: 0
      });

      const orgData = readCoreData('organizations.json', 'organizations');
      const orgEmail = orgData[0]?.email || process.env.SMTP_USER;
      const bcc = (orgEmail && !toEmails.includes(orgEmail)) ? [orgEmail] : [];

      // Add CC recipients if provided
      const ccEmails = request.ccRecipients || [];

      // Merge BCC list - include org email and any additional BCC recipients
      const bccEmails = [
        ...bcc,
        ...(request.bccRecipients || [])
      ];

      // Convert base64 to Buffer in background if needed
      const processedAttachments: any[] = (request.attachments || []).map(a => {
        if (typeof a.content === 'string') {
          try {
            console.log(`[EmailTriggerService] Converting base64 attachment (${a.content.length} chars) to Buffer`);
            // Fix: ensure we use the actual base64 content and avoid large log output
            const buffer = Buffer.from(a.content, 'base64');
            return {
              ...a,
              content: buffer
            };
          } catch (e: any) {
            console.error('[EmailTriggerService] Failed to convert attachment to Buffer:', e.message);
            return a;
          }
        }
        return a;
      });

      console.log(`[EmailTriggerService] Enqueueing job for audit ${audit.id}`);
      await EmailQueue.enqueue({
        auditId: audit.id,
        to: toEmails,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        subject: content.subject,
        bodyHtml: content.bodyHtml,
        bodyText: content.bodyText,
        attachments: processedAttachments as any[],
      });

      console.log(`[EmailTriggerService] Process immediate send complete for trigger ${triggerId}`);
      return { triggerId, auditId: audit.id };
    } catch (error: any) {
      console.error(`[EmailTriggerService] Error in processImmediateSend:`, error);
      throw error;
    }
  }
}

export default EmailTriggerService;
