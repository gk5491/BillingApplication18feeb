import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  CustomerSnapshot, 
  createCustomerSnapshot, 
  determineTaxRegime,
  TaxRegime 
} from '@/lib/customer-snapshot';

interface UseCustomerSnapshotOptions {
  autoFetch?: boolean;
}

interface UseCustomerSnapshotReturn {
  snapshot: CustomerSnapshot | null;
  taxRegime: TaxRegime;
  isLoading: boolean;
  error: string | null;
  fetchCustomer: (customerId: string) => Promise<CustomerSnapshot | null>;
  clearSnapshot: () => void;
  setSnapshot: (snapshot: CustomerSnapshot | null) => void;
}

export function useCustomerSnapshot(
  customerId: string | null,
  options: UseCustomerSnapshotOptions = {}
): UseCustomerSnapshotReturn {
  const { autoFetch = true } = options;
  const { toast } = useToast();
  
  const [snapshot, setSnapshot] = useState<CustomerSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCustomer = useCallback(async (id: string): Promise<CustomerSnapshot | null> => {
    if (!id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      
      const data = await response.json();
      const customer = data.data || data;
      
      const customerSnapshot = createCustomerSnapshot(customer);
      setSnapshot(customerSnapshot);
      return customerSnapshot;
    } catch (err) {
      const errorMessage = 'Unable to load customer details. Please retry.';
      setError(errorMessage);
      toast({
        title: 'Warning',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const clearSnapshot = useCallback(() => {
    setSnapshot(null);
    setError(null);
  }, []);
  
  // Auto-fetch when customerId changes
  useEffect(() => {
    if (autoFetch && customerId) {
      fetchCustomer(customerId);
    } else if (!customerId) {
      clearSnapshot();
    }
  }, [customerId, autoFetch, fetchCustomer, clearSnapshot]);
  
  // Calculate tax regime based on current snapshot
  const taxRegime = determineTaxRegime(snapshot);
  
  return {
    snapshot,
    taxRegime,
    isLoading,
    error,
    fetchCustomer,
    clearSnapshot,
    setSnapshot
  };
}
