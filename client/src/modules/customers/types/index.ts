import { BaseEntity, Address, ContactInfo } from '@/shared/types';

export interface Customer extends BaseEntity {
  displayName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  contactInfo?: ContactInfo;
  creditLimit?: number;
  paymentTerms?: number;
  notes?: string;
  isActive: boolean;
}

export interface CreateCustomerDto {
  displayName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  creditLimit?: number;
  paymentTerms?: number;
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
}
