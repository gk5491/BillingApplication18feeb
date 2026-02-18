/**
 * Email Queue Service - JSON Implementation
 * 
 * Handles asynchronous email processing using JSON storage for state tracking.
 * This version uses a simplified in-memory queue for Replit environment compatibility.
 */

import { EmailProviderAdapter } from './emailProviderAdapter';
import { EmailDataService } from './emailDataService';

interface EmailJob {
  auditId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export class EmailQueue {
  private static isProcessing = false;
  private static queue: EmailJob[] = [];

  /**
   * Initialize email queue
   */
  static initialize() {
    console.log('✅ Email Queue (JSON version) initialized');
    // Start the worker loop
    this.processQueue();
  }

  /**
   * Enqueue email for sending
   */
  static async enqueue(job: EmailJob): Promise<void> {
    try {
      console.log(`📧 Enqueuing email for ${job.to.join(', ')} (Audit ID: ${job.auditId})`);
      this.queue.push(job);
      console.log(`📧 Job pushed to memory queue (Queue size: ${this.queue.length})`);
      
      // Trigger processing if not already running
      if (!this.isProcessing) {
        console.log(`📧 Starting queue processing loop`);
        // Use setImmediate to ensure we don't block the caller
        setImmediate(() => {
          this.processQueue().catch(err => {
            console.error('Error in background processQueue:', err);
          });
        });
      }
    } catch (error: any) {
      console.error(`❌ Error enqueuing email:`, error);
      throw error;
    }
  }

  /**
   * Background process loop
   */
  private static async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        try {
          await this.sendEmail(job);
        } catch (error: any) {
          console.error(`❌ Job ${job.auditId} failed, discarding after error:`, error.message);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send the email via provider
   */
  private static async sendEmail(job: EmailJob): Promise<void> {
    console.log(`🚀 Attempting to send email ${job.auditId} to ${job.to.join(', ')}`);
    try {
      EmailDataService.updateAudit(job.auditId, { 
        status: 'sending',
        updatedAt: new Date().toISOString()
      });

      const result = await EmailProviderAdapter.send({
        to: job.to,
        cc: job.cc,
        bcc: job.bcc,
        subject: job.subject,
        html: job.bodyHtml,
        text: job.bodyText,
        attachments: job.attachments,
      });

      EmailDataService.updateAudit(job.auditId, {
        status: 'sent',
        sentAt: new Date().toISOString(),
        providerMessageId: result.messageId,
        providerResponse: JSON.stringify(result.response) // Fixed and stringified
      });

      console.log(`✅ Email sent successfully: ${result.messageId}`);
    } catch (error: any) {
      console.error(`❌ Email send failed for audit ${job.auditId}:`, error.message);
      
      EmailDataService.updateAudit(job.auditId, {
        status: 'failed',
        errorMessage: error.message,
        updatedAt: new Date().toISOString()
      });
      
      throw error;
    }
  }
}
