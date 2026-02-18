
/**
 * Email Provider Adapter - Mock Implementation
 * 
 * Simulates sending emails by logging them to the console.
 * Uses 'noreply@cybaemtech.com' as the sender.
 */

interface EmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export class EmailProviderAdapter {

  /**
   * Initialize - No-op for mock provider
   */
  static initialize() {
    console.log('✅ Mock Email Provider initialized (noreply@cybaemtech.com)');
  }

  /**
   * Verify - Always returns true for mock provider
   */
  static async verify(): Promise<boolean> {
    console.log('✅ Mock Email Provider verification successful');
    return true;
  }

  /**
   * Send email - Logs to console instead of sending
   */
  static async send(params: EmailParams): Promise<{
    messageId: string;
    response: any;
  }> {
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fromAddress = 'noreply@cybaemtech.com';

    console.log('---------------------------------------------------');
    console.log(`📧 [MOCK EMAIL SENT] ID: ${messageId}`);
    console.log(`From:    Billing System <${fromAddress}>`);
    console.log(`To:      ${params.to.join(', ')}`);
    if (params.cc?.length) console.log(`CC:      ${params.cc.join(', ')}`);
    if (params.bcc?.length) console.log(`BCC:     ${params.bcc.join(', ')}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`Body (${params.html.length} chars HTML, ${params.text.length} chars Text)`);
    if (params.attachments?.length) {
      console.log(`Attachments: ${params.attachments.length} file(s)`);
      params.attachments.forEach(att => {
        console.log(` - ${att.filename} (${att.content.length} bytes)`);
      });
    }
    console.log('---------------------------------------------------');

    return {
      messageId: messageId,
      response: '250 2.0.0 OK (Mock)',
    };
  }
}

export default EmailProviderAdapter;
