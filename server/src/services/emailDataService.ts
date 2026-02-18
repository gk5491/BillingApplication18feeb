/**
 * Email Data Service - JSON Implementation
 * 
 * Manages email-related data in JSON files for the modular billing application.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory is expected to be in server/data
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const EMAIL_TRIGGERS_FILE = path.join(DATA_DIR, 'emailTriggers.json');
const EMAIL_AUDITS_FILE = path.join(DATA_DIR, 'emailAudits.json');
const EMAIL_TEMPLATES_FILE = path.join(DATA_DIR, 'emailTemplates.json');
const EMAIL_RATE_LIMITS_FILE = path.join(DATA_DIR, 'emailRateLimits.json');
const CONTACT_PERSONS_FILE = path.join(DATA_DIR, 'contactPersons.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile(filePath: string, defaultData: any = { data: [] }) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultData;
  }
}

function writeFile(filePath: string, data: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error(`❌ Failed to write to file ${filePath}:`, error.message);
    // Don't throw, just log
  }
}

export class EmailDataService {
  // Triggers
  static getTriggers() {
    return readFile(EMAIL_TRIGGERS_FILE).triggers || [];
  }

  static saveTrigger(trigger: any) {
    const data = readFile(EMAIL_TRIGGERS_FILE, { triggers: [] });
    const newTrigger = { id: randomUUID(), ...trigger, createdAt: new Date().toISOString() };
    data.triggers.push(newTrigger);
    writeFile(EMAIL_TRIGGERS_FILE, data);
    return newTrigger;
  }

  // Audits
  static getAudits() {
    return readFile(EMAIL_AUDITS_FILE).audits || [];
  }

  static saveAudit(audit: any) {
    const data = readFile(EMAIL_AUDITS_FILE, { audits: [] });
    const newAudit = { id: randomUUID(), ...audit, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    data.audits.push(newAudit);
    writeFile(EMAIL_AUDITS_FILE, data);
    return newAudit;
  }

  static updateAudit(id: string, updates: any) {
    const data = readFile(EMAIL_AUDITS_FILE, { audits: [] });
    const index = data.audits.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      data.audits[index] = { ...data.audits[index], ...updates, updatedAt: new Date().toISOString() };
      writeFile(EMAIL_AUDITS_FILE, data);
      return data.audits[index];
    }
    return null;
  }

  // Templates
  static getTemplates() {
    const data = readFile(EMAIL_TEMPLATES_FILE, { templates: [] });
    if (data.templates && data.templates.length === 0) {
      // Initialize with default templates if empty
      const defaults = [
        {
          id: 'tpl_invoice_default',
          name: 'Default Invoice Email',
          category: 'invoice',
          subjectTemplate: 'Invoice {{transaction.number}} from {{organization.name}}',
          bodyHtmlTemplate: '<p>Hi {{contact.name}},</p><p>Please find attached invoice {{transaction.number}} for {{transaction.total_formatted}}.</p><p>Due date: {{transaction.due_date_formatted}}</p><p>Thank you for your business!</p><p>{{organization.name}}</p>',
          bodyTextTemplate: 'Hi {{contact.name}},\n\nPlease find attached invoice {{transaction.number}} for {{transaction.total_formatted}}.\n\nDue date: {{transaction.due_date_formatted}}\n\nThank you for your business!\n\n{{organization.name}}',
          isDefault: true
        },
        {
          id: 'tpl_password_reset',
          name: 'Password Reset Email',
          category: 'auth',
          subjectTemplate: 'Password Reset for {{organization.name}}',
          bodyHtmlTemplate: '<p>Hi {{name}},</p><p>We received a request to reset your password. Your temporary password is: <strong>{{tempPassword}}</strong></p><p>Please log in and change your password immediately.</p><p>Regards,<br>{{organization.name}}</p>',
          bodyTextTemplate: 'Hi {{name}},\n\nWe received a request to reset your password. Your temporary password is: {{tempPassword}}\n\nPlease log in and change your password immediately.\n\nRegards,\n{{organization.name}}',
          isDefault: false
        }
      ];
      data.templates = defaults;
      writeFile(EMAIL_TEMPLATES_FILE, data);
    }
    return data.templates || [];
  }

  static getTemplateById(id: string) {
    if (id === 'tpl_statement_default' || id === 'default_statement') {
      return {
        id: 'tpl_statement_default',
        name: 'Statement Email',
        category: 'statement',
        subjectTemplate: 'Statement from {{organization.name}}',
        bodyHtmlTemplate: '<p>Hi {{contact.name}},</p><p>Please find your statement attached.</p><p>Thank you!</p><p>{{organization.name}}</p>',
        bodyTextTemplate: 'Hi {{contact.name}},\n\nPlease find your statement attached.\n\nThank you!\n\n{{organization.name}}',
        isDefault: false
      };
    }
    try {
      const templates = this.getTemplates();
      return templates.find((t: any) => t.id === id || (id === 'default' && t.isDefault)) || null;
    } catch (e) {
      console.error('Error in getTemplateById:', e);
      return null;
    }
  }

  // Contact Persons
  static getContactPersons(customerId?: string) {
    const contacts = readFile(CONTACT_PERSONS_FILE, { contactPersons: [] }).contactPersons || [];
    if (customerId) {
      return contacts.filter((c: any) => c.customerId === customerId);
    }
    return contacts;
  }

  // Rate Limits
  static getRateLimit(customerId: string) {
    const limits = readFile(EMAIL_RATE_LIMITS_FILE, { rateLimits: [] }).rateLimits || [];
    const now = new Date();
    return limits.find((l: any) => l.customerId === customerId && new Date(l.windowEnd) > now);
  }

  static saveRateLimit(limit: any) {
    const data = readFile(EMAIL_RATE_LIMITS_FILE, { rateLimits: [] });
    const index = data.rateLimits.findIndex((l: any) => l.customerId === limit.customerId && l.windowStart === limit.windowStart);
    if (index !== -1) {
      data.rateLimits[index] = { ...data.rateLimits[index], ...limit, updatedAt: new Date().toISOString() };
    } else {
      data.rateLimits.push({ id: randomUUID(), ...limit, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeFile(EMAIL_RATE_LIMITS_FILE, data);
  }
}
