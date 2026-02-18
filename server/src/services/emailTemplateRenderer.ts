/**
 * Email Template Renderer
 * 
 * Renders email templates with dynamic data using Handlebars
 */

import Handlebars from 'handlebars';
import { EmailDataService } from './emailDataService';

interface RenderContext {
  templateId?: string;
  context: {
    transaction?: any;
    customer?: any;
    payment?: any;
    contact?: any;
    contacts?: any[];
    organization?: any;
  };
  customSubject?: string;
  customBody?: string;
}

interface RenderedEmail {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export class EmailTemplateRenderer {
  /**
   * Render email template with context data
   */
  static async render(params: RenderContext): Promise<RenderedEmail> {
    let template;
    
    // Get template from JSON storage
    if (params.templateId) {
      template = EmailDataService.getTemplateById(params.templateId);
    }
    
    // Fallback to default template
    if (!template) {
      template = EmailDataService.getTemplateById('default');
    }
    
    // Use custom or template subject
    const subjectTemplate = params.customSubject || template?.subjectTemplate || 'Document from {{organization.name}}';
    const bodyHtmlTemplate = params.customBody || template?.bodyHtmlTemplate || this.getDefaultHtmlTemplate();
    const bodyTextTemplate = template?.bodyTextTemplate || this.getDefaultTextTemplate();
    
    // Prepare context data
    const context = this.prepareContext(params.context);
    
    // Check if templates are defined to avoid crashes
    const subjectTemplateStr = subjectTemplate || '';
    const bodyHtmlTemplateStr = bodyHtmlTemplate || '';
    const bodyTextTemplateStr = bodyTextTemplate || '';

    // Compile and render templates
    const subjectCompiled = Handlebars.compile(subjectTemplateStr);
    const bodyHtmlCompiled = Handlebars.compile(bodyHtmlTemplateStr);
    const bodyTextCompiled = Handlebars.compile(bodyTextTemplateStr);
    
    return {
      subject: subjectCompiled(context),
      bodyHtml: bodyHtmlCompiled(context),
      bodyText: bodyTextCompiled(context),
    };
  }
  
  /**
   * Prepare context data with helpers
   */
  private static prepareContext(context: any): any {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    });
    
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });
    
    // Add organization info from env
    const enrichedContext = {
      ...context,
      organization: {
        name: process.env.ORGANIZATION_NAME || 'Your Company',
        email: process.env.SMTP_USER || 'support@company.com',
        phone: process.env.ORGANIZATION_PHONE || '',
        website: process.env.ORGANIZATION_WEBSITE || '',
        address: process.env.ORGANIZATION_ADDRESS || '',
      },
      // Format amounts if transaction exists
      ...(context.transaction && {
        transaction: {
          ...context.transaction,
          total_formatted: this.formatCurrency(context.transaction.total || 0),
          outstanding_formatted: this.formatCurrency(context.transaction.outstanding || 0),
          due_date_formatted: context.transaction.dueDate 
            ? this.formatDate(context.transaction.dueDate)
            : 'N/A',
        },
      }),
      // Format payment if exists
      ...(context.payment && {
        payment: {
          ...context.payment,
          amount_formatted: this.formatCurrency(context.payment.amount || 0),
        },
      }),
    };
    
    return enrichedContext;
  }
  
  /**
   * Format currency helper
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }
  
  /**
   * Format date helper
   */
  private static formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  /**
   * Default HTML template
   */
  private static getDefaultHtmlTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff; }
    .content { padding: 20px; background-color: #ffffff; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #f8f9fa; }
    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .button:hover { background-color: #0056b3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>{{organization.name}}</h2>
    </div>
    
    <div class="content">
      <p>Hi {{contact.name}},</p>
      
      {{#if transaction}}
        <p>Please find attached {{transaction.type}} <strong>{{transaction.number}}</strong> for {{transaction.total_formatted}}.</p>
        
        {{#if transaction.due_date_formatted}}
          <p>Due date: <strong>{{transaction.due_date_formatted}}</strong></p>
        {{/if}}
        
        {{#if payment_link}}
          <p style="text-align: center;">
            <a href="{{payment_link}}" class="button">Pay Now</a>
          </p>
        {{/if}}
      {{/if}}
      
      {{#if payment}}
        <p>Thank you for your payment of {{payment.amount_formatted}}.</p>
        <p>Payment reference: <strong>{{payment.reference}}</strong></p>
      {{/if}}
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>{{organization.name}}</p>
    </div>
    
    <div class="footer">
      <p>{{organization.name}}</p>
      {{#if organization.address}}
        <p>{{organization.address}}</p>
      {{/if}}
      {{#if organization.phone}}
        <p>Phone: {{organization.phone}}</p>
      {{/if}}
      <p>Email: {{organization.email}}</p>
      <p><small>This is an automated email. Please do not reply directly to this message.</small></p>
    </div>
  </div>
</body>
</html>
    `;
  }
  
  /**
   * Default text template
   */
  private static getDefaultTextTemplate(): string {
    return `
Hi {{contact.name}},

{{#if transaction}}
Please find attached {{transaction.type}} {{transaction.number}} for {{transaction.total_formatted}}.
{{#if transaction.due_date_formatted}}
Due date: {{transaction.due_date_formatted}}
{{/if}}
{{/if}}

{{#if payment}}
Thank you for your payment of {{payment.amount_formatted}}.
Payment reference: {{payment.reference}}
{{/if}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{organization.name}}

---
{{organization.name}}
{{#if organization.address}}{{organization.address}}{{/if}}
{{#if organization.phone}}Phone: {{organization.phone}}{{/if}}
Email: {{organization.email}}

This is an automated email. Please do not reply directly to this message.
    `;
  }
}

export default EmailTemplateRenderer;
