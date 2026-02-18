export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    THEME: 'theme',
    SIDEBAR_STATE: 'sidebar_state',
  },
  ROLES: {
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    MANAGER: 'manager',
    VIEWER: 'viewer',
  },
  PERMISSIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
  },
  STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
  },
  PAYMENT_STATUS: {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
  },
  INVOICE_STATUS: {
    DRAFT: 'draft',
    SENT: 'sent',
    VIEWED: 'viewed',
    PAID: 'paid',
    OVERDUE: 'overdue',
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'dd MMM yyyy, hh:mm a',
  API: 'yyyy-MM-dd',
} as const;

export const CURRENCY = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
} as const;
