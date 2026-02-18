import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useCustomerSnapshot } from './use-customer-snapshot';
import { 
  CustomerSnapshot, 
  TaxRegime,
  formatAddressDisplay,
  calculateDueDateFromTerms 
} from '@/lib/customer-snapshot';

interface TransactionBootstrapOptions {
  transactionType: 'invoice' | 'quote' | 'sales_order' | 'delivery_challan' | 'payment' | 'credit_note';
}

interface TransactionBootstrapReturn {
  // Customer data
  customerId: string | null;
  setCustomerId: (id: string | null) => void;
  customerSnapshot: CustomerSnapshot | null;
  taxRegime: TaxRegime;
  isLoadingCustomer: boolean;
  customerError: string | null;
  
  // Formatted data for form population
  formData: {
    customerName: string;
    displayName: string;
    billingAddressStr: string;
    shippingAddressStr: string;
    gstTreatment: string;
    taxPreference: 'taxable' | 'tax_exempt';
    gstin: string;
    placeOfSupply: string;
    pan: string;
    currency: string;
    paymentTerms: string;
    isTaxExempt: boolean;
    exemptionReason: string;
  };
  
  // Actions
  refreshCustomer: () => Promise<void>;
  onCustomerChange: (newCustomerId: string) => void;
}

export function useTransactionBootstrap(
  options: TransactionBootstrapOptions
): TransactionBootstrapReturn {
  const [location] = useLocation();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<string>('');
  
  // Use customer snapshot hook (must be defined before useEffect that uses clearSnapshot)
  const {
    snapshot: customerSnapshot,
    taxRegime,
    isLoading: isLoadingCustomer,
    error: customerError,
    fetchCustomer,
    clearSnapshot
  } = useCustomerSnapshot(customerId);
  
  // Extract customerId from URL whenever location or window.location.search changes
  // Wouter's location doesn't include query params, so we use the native browser API
  useEffect(() => {
    const currentSearch = window.location.search;
    
    // Only re-process if the search string has changed
    if (currentSearch !== lastSearch) {
      setLastSearch(currentSearch);
      const searchParams = new URLSearchParams(currentSearch);
      const urlCustomerId = searchParams.get('customerId');
      
      // Set or clear customerId based on URL
      if (urlCustomerId && urlCustomerId !== customerId) {
        setCustomerId(urlCustomerId);
      } else if (!urlCustomerId && customerId && lastSearch !== '') {
        // Clear customerId when navigating to a page without customerId param
        // Only clear if we had a previous search string (to avoid clearing on initial mount)
        setCustomerId(null);
        clearSnapshot();
      }
    }
  }, [location, customerId, lastSearch, clearSnapshot]);
  
  // Handle customer change
  const onCustomerChange = useCallback((newCustomerId: string) => {
    if (newCustomerId === customerId) return;
    
    // Clear previous data
    clearSnapshot();
    
    // Set new customer
    setCustomerId(newCustomerId || null);
  }, [customerId, clearSnapshot]);
  
  // Refresh customer data
  const refreshCustomer = useCallback(async () => {
    if (customerId) {
      await fetchCustomer(customerId);
    }
  }, [customerId, fetchCustomer]);
  
  // Computed form data for easy consumption
  const formData = {
    customerName: customerSnapshot?.customerName || '',
    displayName: customerSnapshot?.displayName || '',
    billingAddressStr: customerSnapshot ? formatAddressDisplay(customerSnapshot.billingAddress) : '',
    shippingAddressStr: customerSnapshot ? formatAddressDisplay(customerSnapshot.shippingAddress) : '',
    gstTreatment: customerSnapshot?.gstTreatment || '',
    taxPreference: customerSnapshot?.taxPreference || 'taxable',
    gstin: customerSnapshot?.gstin || '',
    placeOfSupply: customerSnapshot?.placeOfSupply || '',
    pan: customerSnapshot?.pan || '',
    currency: customerSnapshot?.currency || 'INR',
    paymentTerms: customerSnapshot?.paymentTerms || 'Due on Receipt',
    isTaxExempt: customerSnapshot?.taxPreference === 'tax_exempt',
    exemptionReason: customerSnapshot?.exemptionReason || ''
  };
  
  return {
    customerId,
    setCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData,
    refreshCustomer,
    onCustomerChange
  };
}
