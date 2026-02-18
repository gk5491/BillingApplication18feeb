import { createContext, useContext, useState, ReactNode } from "react";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  salespersonId?: string;
  terms?: string;
  billingAddress?: string;
}

export interface ContactPerson {
  id: string;
  customerId: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  email?: string;
  workPhone?: string;
  mobile?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface CustomerComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  displayName: string;
  companyName: string;
  email: string;
  workPhone: string;
  mobile?: string;
  gstTreatment: string;
  receivables: string;
  avatar: string;
  gstin?: string;
  pan?: string;
  customerType?: "business" | "individual";
  status?: "active" | "inactive";
  billingAddress?: Address;
  shippingAddress?: Address;
  currency?: string;
  paymentTerms?: string;
  placeOfSupply?: string;
  taxPreference?: "taxable" | "tax_exempt";
  portalStatus?: "enabled" | "disabled";
  source?: string;
  comments?: CustomerComment[];
  createdAt?: string;
}

interface AppState {
  invoices: Invoice[];
  customers: Customer[];
  contactPersons: ContactPerson[];
  pendingCustomerId: string | null;
  setPendingCustomerId: (id: string | null) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  addCustomer: (customer: Omit<Customer, "id">) => Customer;
  deleteInvoice: (id: string) => void;
  deleteCustomer: (id: string) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  cloneCustomer: (id: string) => Customer | null;
  toggleCustomerStatus: (id: string) => void;
  addCustomerComment: (customerId: string, text: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  addContactPerson: (person: Omit<ContactPerson, "id">) => ContactPerson;
  getContactPersonsByCustomer: (customerId: string) => ContactPerson[];
  getAllSalespersons: () => ContactPerson[];
}

const initialInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-00012",
    customerName: "Acme Corp Inc.",
    date: "04/12/2025",
    dueDate: "03/01/2026",
    amount: 1699.20,
    status: "pending",
  },
  {
    id: "2",
    invoiceNumber: "INV-00011",
    customerName: "Globex Corporation",
    date: "01/12/2025",
    dueDate: "31/12/2025",
    amount: 2450.00,
    status: "paid",
  },
  {
    id: "3",
    invoiceNumber: "INV-00010",
    customerName: "Soylent Corp",
    date: "28/11/2025",
    dueDate: "28/12/2025",
    amount: 3200.50,
    status: "overdue",
  },
  {
    id: "4",
    invoiceNumber: "INV-00009",
    customerName: "Initech LLC",
    date: "25/11/2025",
    dueDate: "25/12/2025",
    amount: 1850.00,
    status: "draft",
  },
];

const initialCustomers: Customer[] = [
  {
    id: "1",
    displayName: "A SQUARE ARCHITECTS",
    companyName: "A SQUARE ARCHITECTS",
    email: "sushantbhosale238@gmail.com",
    workPhone: "",
    gstTreatment: "Registered Business - Regular",
    receivables: "₹0.00",
    avatar: "AS",
    customerType: "business",
    status: "active",
    billingAddress: { street: "Pune", city: "Pune", state: "Maharashtra", country: "India", pincode: "411057" },
    shippingAddress: { street: "Pune", city: "Pune", state: "Maharashtra", country: "India", pincode: "411057" },
    currency: "INR",
    paymentTerms: "Due on Receipt",
    placeOfSupply: "Maharashtra",
    taxPreference: "taxable",
    portalStatus: "disabled",
    source: "CSV",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    displayName: "AABHA CONTRACEPTIVES PRIVATE LIMITED",
    companyName: "AABHA CONTRACEPTIVES PRIVATE LIMITED",
    email: "aabhacontraceptives@gmail.com",
    workPhone: "",
    gstTreatment: "Registered Business - Regular",
    receivables: "₹0.00",
    avatar: "AC",
    gstin: "27AAGCA4900Q1ZE",
    pan: "AAGCA4900Q",
    customerType: "business",
    status: "active",
    billingAddress: { street: "Plot No G- 2 Katfal Baramati, Maharashtra Industrial Development Corporation Area, Baramati", city: "Pune", state: "Maharashtra 413133", country: "India", pincode: "413133" },
    shippingAddress: { street: "Plot No G- 2 Katfal Baramati, Maharashtra Industrial Development Corporation Area, Baramati", city: "Pune", state: "Maharashtra 413133", country: "India", pincode: "413133" },
    currency: "INR",
    paymentTerms: "Due on Receipt",
    placeOfSupply: "Maharashtra",
    taxPreference: "taxable",
    portalStatus: "disabled",
    source: "CSV",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    displayName: "Abhijit Patil",
    companyName: "",
    email: "",
    workPhone: "",
    gstTreatment: "Consumer",
    receivables: "₹0.00",
    avatar: "AP",
    customerType: "individual",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "4",
    displayName: "ABN INTERARCH PRIVATE LIMITED",
    companyName: "ABN INTERARCH PRIVATE LIMITED",
    email: "admin@abninterarch.in",
    workPhone: "",
    gstTreatment: "Registered Business - Regular",
    receivables: "₹0.00",
    avatar: "AI",
    customerType: "business",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    placeOfSupply: "Maharashtra",
    taxPreference: "taxable",
    portalStatus: "disabled",
    source: "CSV",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "5",
    displayName: "Abyssal TechEdge",
    companyName: "Abyssal TechEdge",
    email: "sksachin78@gmail.com",
    workPhone: "",
    gstTreatment: "Unregistered Business",
    receivables: "₹0.00",
    avatar: "AT",
    customerType: "business",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "6",
    displayName: "Acumen Engineers",
    companyName: "Acumen Engineers",
    email: "manoj@acumenengineers.in",
    workPhone: "",
    gstTreatment: "Unregistered Business",
    receivables: "₹0.00",
    avatar: "AE",
    customerType: "business",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "7",
    displayName: "Adore Art Interiors",
    companyName: "Adore Art Interiors",
    email: "saurabhpasricha@gmail.com",
    workPhone: "99998 28462",
    gstTreatment: "Unregistered Business",
    receivables: "₹0.00",
    avatar: "AA",
    customerType: "business",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "8",
    displayName: "Akoya Motors Pvt Ltd",
    companyName: "Akoya Motors Pvt Ltd",
    email: "hr.mgr@akoyamotors.com",
    workPhone: "8956212598",
    gstTreatment: "Registered Business - Regular",
    receivables: "₹0.00",
    avatar: "AM",
    customerType: "business",
    status: "active",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    placeOfSupply: "Maharashtra",
    taxPreference: "taxable",
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const initialContactPersons: ContactPerson[] = [
  {
    id: "cp1",
    customerId: "1",
    salutation: "Mr.",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@acme.com",
    workPhone: "+1 (555) 123-4568",
  },
  {
    id: "cp2",
    customerId: "1",
    salutation: "Ms.",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@acme.com",
    workPhone: "+1 (555) 123-4569",
  },
  {
    id: "cp3",
    customerId: "2",
    salutation: "Mr.",
    firstName: "Michael",
    lastName: "Brown",
    email: "m.brown@globex.com",
    workPhone: "+1 (555) 987-6544",
  },
  {
    id: "cp4",
    customerId: "3",
    salutation: "Mrs.",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.d@soylent.com",
    workPhone: "+1 (555) 456-7891",
  },
  {
    id: "cp5",
    customerId: "4",
    salutation: "Mr.",
    firstName: "Peter",
    lastName: "Gibbons",
    email: "peter@initech.com",
    workPhone: "+1 (555) 111-2223",
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>(initialContactPersons);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: String(Date.now()),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const addCustomer = (customer: Omit<Customer, "id">): Customer => {
    const newCustomer: Customer = {
      ...customer,
      id: String(Date.now()),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((cust) => cust.id !== id));
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((cust) => (cust.id === id ? { ...cust, ...updates } : cust))
    );
  };

  const cloneCustomer = (id: string): Customer | null => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return null;
    const newCustomer: Customer = {
      ...customer,
      id: String(Date.now()),
      displayName: `${customer.displayName} (Copy)`,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const toggleCustomerStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((cust) =>
        cust.id === id
          ? { ...cust, status: cust.status === "active" ? "inactive" : "active" }
          : cust
      )
    );
  };

  const addCustomerComment = (customerId: string, text: string) => {
    const newComment: CustomerComment = {
      id: `comment_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      createdBy: "Admin User",
    };
    setCustomers((prev) =>
      prev.map((cust) =>
        cust.id === customerId
          ? { ...cust, comments: [...(cust.comments || []), newComment] }
          : cust
      )
    );
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find((c) => c.id === id);
  };

  const addContactPerson = (person: Omit<ContactPerson, "id">): ContactPerson => {
    const newPerson: ContactPerson = {
      ...person,
      id: `cp_${Date.now()}`,
    };
    setContactPersons((prev) => [...prev, newPerson]);
    return newPerson;
  };

  const getContactPersonsByCustomer = (customerId: string): ContactPerson[] => {
    return contactPersons.filter((cp) => cp.customerId === customerId);
  };

  const getAllSalespersons = (): ContactPerson[] => {
    return contactPersons;
  };

  return (
    <AppContext.Provider
      value={{
        invoices,
        customers,
        contactPersons,
        pendingCustomerId,
        setPendingCustomerId,
        addInvoice,
        addCustomer,
        deleteInvoice,
        deleteCustomer,
        updateInvoice,
        updateCustomer,
        cloneCustomer,
        toggleCustomerStatus,
        addCustomerComment,
        getCustomerById,
        addContactPerson,
        getContactPersonsByCustomer,
        getAllSalespersons,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
