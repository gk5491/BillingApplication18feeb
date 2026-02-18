// Customer Snapshot Types and Utilities
// Used for storing immutable customer data in transactions

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface CustomerSnapshot {
  customerId: string;
  customerName: string;
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  
  // Addresses
  billingAddress: Address;
  shippingAddress: Address;
  
  // Tax & Compliance
  gstTreatment: string;
  taxPreference: 'taxable' | 'tax_exempt';
  gstin: string;
  placeOfSupply: string;
  pan: string;
  exemptionReason?: string;
  
  // Commercial
  currency: string;
  paymentTerms: string;
  priceList?: string;
  
  // Snapshot metadata
  snapshotDate: string;
}

export interface TaxRegime {
  regime: 'intra' | 'inter' | 'exempt';
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  reason?: string;
}

// Company's Place of Supply (from organization settings)
// Default to Maharashtra (27) if not configured
const COMPANY_STATE_CODE = '27'; // Maharashtra

// Extract state code from GSTIN (first 2 characters)
export function extractStateCodeFromGSTIN(gstin: string): string {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
}

// Determine tax regime based on customer's place of supply vs company's place of supply
export function determineTaxRegime(
  customerSnapshot: CustomerSnapshot | null,
  companyPlaceOfSupply: string = COMPANY_STATE_CODE
): TaxRegime {
  // If no customer data, default to intra-state
  if (!customerSnapshot) {
    return {
      regime: 'intra',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      reason: 'No customer selected'
    };
  }
  
  // If tax exempt
  if (customerSnapshot.taxPreference === 'tax_exempt') {
    return {
      regime: 'exempt',
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      reason: customerSnapshot.exemptionReason || 'Customer is tax exempt'
    };
  }
  
  // Extract state code from customer's place of supply or GSTIN
  let customerStateCode = '';
  
  // Try to get from Place of Supply first (format: "27 - Maharashtra" or just "27")
  if (customerSnapshot.placeOfSupply) {
    const match = customerSnapshot.placeOfSupply.match(/^(\d{2})/);
    if (match) {
      customerStateCode = match[1];
    }
  }
  
  // Fallback to GSTIN
  if (!customerStateCode && customerSnapshot.gstin) {
    customerStateCode = extractStateCodeFromGSTIN(customerSnapshot.gstin);
  }
  
  // If still no state code, default to intra-state
  if (!customerStateCode) {
    return {
      regime: 'intra',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      reason: 'Same state transaction (default)'
    };
  }
  
  // Compare state codes
  if (customerStateCode === companyPlaceOfSupply) {
    return {
      regime: 'intra',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      reason: 'Same state transaction'
    };
  } else {
    return {
      regime: 'inter',
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 18,
      reason: 'Inter-state transaction'
    };
  }
}

// Calculate tax amounts for a line item
export function calculateItemTax(
  amount: number,
  gstRate: number,
  taxRegime: TaxRegime
): { cgst: number; sgst: number; igst: number; total: number } {
  if (taxRegime.regime === 'exempt' || gstRate <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, total: 0 };
  }
  
  const totalTax = amount * (gstRate / 100);
  
  if (taxRegime.regime === 'inter') {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      total: totalTax
    };
  } else {
    // Intra-state: split equally between CGST and SGST
    const halfTax = totalTax / 2;
    return {
      cgst: halfTax,
      sgst: halfTax,
      igst: 0,
      total: totalTax
    };
  }
}

// Convert customer API response to CustomerSnapshot
export function createCustomerSnapshot(customer: any): CustomerSnapshot {
  const defaultAddress: Address = {
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  };
  
  const billingAddress: Address = customer.billingAddress 
    ? (typeof customer.billingAddress === 'string' 
        ? { ...defaultAddress, street: customer.billingAddress }
        : { ...defaultAddress, ...customer.billingAddress })
    : defaultAddress;
    
  // Use shipping address if available, otherwise fallback to billing address
  const shippingAddress: Address = customer.shippingAddress 
    ? (typeof customer.shippingAddress === 'string'
        ? { ...defaultAddress, street: customer.shippingAddress }
        : { ...defaultAddress, ...customer.shippingAddress })
    : billingAddress;
  
  return {
    customerId: customer.id || '',
    customerName: customer.name || '',
    displayName: customer.displayName || customer.name || '',
    companyName: customer.companyName || '',
    email: customer.email || '',
    phone: customer.phone || customer.workPhone || '',
    
    billingAddress,
    shippingAddress,
    
    gstTreatment: customer.gstTreatment || '',
    taxPreference: customer.taxPreference === 'tax_exempt' ? 'tax_exempt' : 'taxable',
    gstin: customer.gstin || '',
    placeOfSupply: customer.placeOfSupply || '',
    pan: customer.pan || '',
    exemptionReason: customer.exemptionReason || '',
    
    currency: customer.currency || 'INR',
    paymentTerms: customer.paymentTerms || 'Due on Receipt',
    priceList: customer.priceList || '',
    
    snapshotDate: new Date().toISOString()
  };
}

// Format address for display
export function formatAddressDisplay(address: Address | null | undefined): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
    address.pincode
  ].filter(Boolean);
  return parts.join('\n');
}

// Calculate due date from payment terms
export function calculateDueDateFromTerms(invoiceDate: Date, paymentTerms: string): Date {
  const termsMapping: Record<string, number> = {
    'Due on Receipt': 0,
    'Net 15': 15,
    'Net 30': 30,
    'Net 45': 45,
    'Net 60': 60,
    'due_on_receipt': 0,
    'net15': 15,
    'net30': 30,
    'net45': 45,
    'net60': 60
  };
  
  const days = termsMapping[paymentTerms] ?? 30; // Default to Net 30
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}
