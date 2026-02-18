# Workflow Rules Examples

This document contains practical workflow rule examples for the Customer Lifecycle Email System.

---

## 1. Invoice Overdue Reminders (Escalation Series)

### Reminder 1: 3 Days After Due Date

```json
{
  "id": "wf_overdue_3day",
  "name": "3-Day Overdue Reminder (Gentle)",
  "description": "Send first gentle reminder 3 days after invoice due date",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 3, "$lt": 7 },
    "outstanding": { "$gt": 0 },
    "status": "overdue"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_overdue_reminder_gentle",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

### Reminder 2: 7 Days After Due Date

```json
{
  "id": "wf_overdue_7day",
  "name": "7-Day Overdue Reminder (Firm)",
  "description": "Send firm reminder 7 days after invoice due date",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 7, "$lt": 14 },
    "outstanding": { "$gt": 0 },
    "status": "overdue"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_overdue_reminder_firm",
        "recipientSelection": "all_billing_contacts",
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "high"
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Follow up on overdue invoice {{invoice.number}}",
        "assignTo": "collections_team",
        "dueDate": "+3 days"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

### Reminder 3: 14 Days After Due Date

```json
{
  "id": "wf_overdue_14day",
  "name": "14-Day Overdue Reminder (Final Notice)",
  "description": "Send final notice 14 days after invoice due date",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 14 },
    "outstanding": { "$gt": 0 },
    "status": "overdue"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_overdue_final_notice",
        "recipientSelection": "all_contacts",
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "urgent",
        "ccInternal": ["collections@mycompany.com"]
      }
    },
    {
      "type": "update_status",
      "config": {
        "field": "collections_flag",
        "value": true
      }
    },
    {
      "type": "webhook",
      "config": {
        "url": "https://api.mycompany.com/webhooks/collections",
        "method": "POST",
        "payload": {
          "event": "invoice_severely_overdue",
          "invoiceId": "{{invoice.id}}",
          "customerId": "{{customer.id}}",
          "amount": "{{invoice.outstanding}}"
        }
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 2. Payment Confirmation Workflows

### Thank You Email After Payment

```json
{
  "id": "wf_payment_thank_you",
  "name": "Payment Thank You Email",
  "description": "Send thank you email immediately after payment received",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "payment_received",
  "triggerConditions": {
    "amount": { "$gt": 0 },
    "paymentMethod": { "$ne": "write_off" },
    "status": "confirmed"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_payment_thank_you",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "attachmentType": "receipt",
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "customer_group",
  "scopeIds": ["grp_premium_customers"],
  "optInRequired": false
}
```

### Large Payment Alert (Internal)

```json
{
  "id": "wf_large_payment_alert",
  "name": "Large Payment Internal Alert",
  "description": "Alert finance team when payment exceeds threshold",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "payment_received",
  "triggerConditions": {
    "amount": { "$gte": 10000 },
    "status": "confirmed"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_internal_payment_alert",
        "recipientSelection": "internal",
        "recipients": ["finance@mycompany.com", "cfo@mycompany.com"],
        "priority": "high"
      }
    }
  ],
  "enabled": true,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": false
}
```

---

## 3. Invoice Due Date Reminders (Proactive)

### Pre-Due Reminder (3 Days Before)

```json
{
  "id": "wf_invoice_pre_due",
  "name": "Invoice Pre-Due Reminder",
  "description": "Send friendly reminder 3 days before invoice due date",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_due_check",
  "triggerConditions": {
    "daysUntilDue": { "$eq": 3 },
    "outstanding": { "$gt": 0 },
    "status": { "$in": ["sent", "viewed"] }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_invoice_due_soon",
        "recipientSelection": "primary",
        "includeAttachments": false,
        "includePaymentLink": true,
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 4. Recurring Invoice Workflows

### Auto-Send Recurring Invoice

```json
{
  "id": "wf_recurring_auto_send",
  "name": "Auto-Send Recurring Invoices",
  "description": "Automatically send recurring invoices upon generation",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_created",
  "triggerConditions": {
    "isRecurring": true,
    "recurringScheduleAutoEmail": true,
    "isDraft": false
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_recurring_invoice",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 5. Customer Lifecycle Emails

### Welcome Email (Opt-In Only)

```json
{
  "id": "wf_customer_welcome",
  "name": "Customer Welcome Email",
  "description": "Send welcome email to new customers (must be explicitly enabled)",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "customer_created",
  "triggerConditions": {
    "source": "web_signup",
    "emailVerified": true
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_customer_welcome",
        "recipientSelection": "primary",
        "includeAttachments": false,
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

### Client Portal Invitation

```json
{
  "id": "wf_portal_invitation",
  "name": "Client Portal Invitation",
  "description": "Send portal access credentials when portal is enabled for customer",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "portal_enabled",
  "triggerConditions": {
    "portalAccess": true,
    "portalInviteSent": false
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_portal_invitation",
        "recipientSelection": "all_contacts",
        "includeAttachments": false,
        "priority": "normal"
      }
    },
    {
      "type": "update_status",
      "config": {
        "field": "portalInviteSent",
        "value": true
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 6. Estimate Follow-Up Workflows

### Estimate Follow-Up (7 Days After Sent)

```json
{
  "id": "wf_estimate_followup",
  "name": "Estimate Follow-Up",
  "description": "Follow up on estimate 7 days after sending if not accepted",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "estimate_followup_check",
  "triggerConditions": {
    "daysSinceSent": { "$gte": 7 },
    "status": { "$in": ["sent", "viewed"] },
    "notStatus": "accepted"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_estimate_followup",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "priority": "normal"
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 7. Conditional Workflows (Customer-Specific)

### High-Value Customer Special Handling

```json
{
  "id": "wf_vip_invoice_notification",
  "name": "VIP Customer Invoice Notification",
  "description": "Special notification for high-value customers with account manager CC",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_created",
  "triggerConditions": {
    "customerTier": "vip",
    "invoiceTotal": { "$gte": 5000 },
    "isDraft": false
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_vip_invoice",
        "recipientSelection": "primary",
        "ccInternal": ["{{customer.accountManager.email}}"],
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "high"
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Follow up VIP invoice {{invoice.number}}",
        "assignTo": "{{customer.accountManager.id}}",
        "dueDate": "+2 days"
      }
    }
  ],
  "enabled": false,
  "scope": "customer_group",
  "scopeIds": ["grp_vip_customers"],
  "optInRequired": false
}
```

---

## 8. Rate-Limited Reminder Sequence

### Smart Reminder (Respects Rate Limits)

```json
{
  "id": "wf_smart_reminder",
  "name": "Smart Overdue Reminder (Rate-Limited)",
  "description": "Send overdue reminder only if customer hasn't received email recently",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 7 },
    "outstanding": { "$gt": 0 },
    "status": "overdue",
    "emailsSentLast7Days": { "$lt": 2 }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_overdue_reminder",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "normal",
        "respectRateLimits": true
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## 9. Multi-Action Workflow (Complex)

### Overdue Invoice with Escalation

```json
{
  "id": "wf_overdue_escalation",
  "name": "Overdue Invoice Escalation (Multi-Step)",
  "description": "Comprehensive overdue handling with email, task, and status update",
  "organizationId": "org_001",
  "createdBy": "user_admin",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 10 },
    "outstanding": { "$gt": 500 },
    "status": "overdue",
    "collectionsFlag": false
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "tpl_overdue_escalation",
        "recipientSelection": "all_billing_contacts",
        "ccInternal": ["collections@mycompany.com"],
        "includeAttachments": true,
        "includePaymentLink": true,
        "priority": "urgent"
      }
    },
    {
      "type": "update_status",
      "config": {
        "field": "collectionsFlag",
        "value": true
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Collections follow-up: {{customer.name}} - {{invoice.number}}",
        "description": "Invoice {{invoice.number}} is {{invoice.daysOverdue}} days overdue. Outstanding: {{invoice.outstanding_formatted}}",
        "assignTo": "collections_team",
        "priority": "high",
        "dueDate": "+2 days"
      }
    },
    {
      "type": "webhook",
      "config": {
        "url": "https://api.mycompany.com/webhooks/collections",
        "method": "POST",
        "payload": {
          "event": "collections_escalation",
          "invoiceId": "{{invoice.id}}",
          "customerId": "{{customer.id}}",
          "daysOverdue": "{{invoice.daysOverdue}}",
          "outstanding": "{{invoice.outstanding}}"
        }
      }
    }
  ],
  "enabled": false,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

---

## Workflow Trigger Events Reference

### Available Trigger Events

- `invoice_created` - When a new invoice is finalized
- `invoice_overdue_check` - Daily check for overdue invoices
- `invoice_due_check` - Daily check for upcoming due dates
- `payment_received` - When payment is recorded
- `estimate_created` - When estimate is finalized
- `estimate_followup_check` - Periodic check for estimate follow-ups
- `credit_note_issued` - When credit note is created
- `customer_created` - When new customer is added (opt-in only)
- `portal_enabled` - When portal access is granted
- `statement_generated` - When customer statement is generated

### Condition Operators

- `$eq` - Equals
- `$ne` - Not equals
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal
- `$in` - In array
- `$nin` - Not in array

---

## Implementation Notes

1. **All workflows start disabled** - Must be explicitly enabled by admin
2. **Opt-in required by default** - Customer consent for email workflows
3. **Rate limits respected** - Guard middleware checks limits before sending
4. **Audit logging** - Every workflow execution is logged
5. **Preview before enable** - Show impact (number of affected customers)
6. **Rollback capability** - Can disable workflow at any time

---

## Testing Workflow Rules

```bash
# Test workflow evaluation (dry run)
curl -X POST http://localhost:3000/api/workflows/wf_001/test \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "testData": {
      "invoice": {
        "id": "INV-123",
        "daysOverdue": 8,
        "outstanding": 1500,
        "status": "overdue"
      }
    }
  }'

# Expected response:
# {
#   "conditionsMatch": true,
#   "actionsToExecute": ["send_email", "create_task"],
#   "recipients": ["john@acme.com"],
#   "guardChecks": {
#     "customerStatus": "active",
#     "rateLimits": "OK",
#     "recipientValid": true
#   },
#   "wouldSendEmail": true
# }
```

---

This completes the workflow examples covering all major customer lifecycle stages with transaction-driven, opt-in email automation.
