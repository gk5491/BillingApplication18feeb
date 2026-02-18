import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest, optionalAuth } from '../../../middleware/auth';
import { UserRole } from '../../../../../shared/schema';

export const createFlowRouter = (db: any) => {
    const flowRouter = Router();

    const {
        readQuotesData,
        writeQuotesData,
        readInvoicesData,
        writeInvoicesData,
        readCustomersData,
        writeCustomersData,
        readPaymentsReceivedData,
        writePaymentsReceivedData,
        readItemRequestsData,
        writeItemRequestsData,
        readItems,
        writeItems
    } = db;

    // Helper to find all customers by userId or email
    const findAllCustomers = (customersData: any, user: any) => {
        if (!user) return [];
        const userEmail = String(user.email || user.username || "").toLowerCase();
        const userId = String(user.id);

        return customersData.customers.filter((c: any) => {
            const matchesId = c.userId && String(c.userId) === userId;
            const matchesEmail = c.email && String(c.email).toLowerCase() === userEmail;
            return matchesId || matchesEmail;
        });
    };

    // Helper to find a primary customer profile (the first one found)
    const findCustomer = (customersData: any, user: any) => {
        const customers = findAllCustomers(customersData, user);
        return customers.length > 0 ? customers[0] : null;
    };

    // Customer Profile Management
    flowRouter.post('/profile', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { name, phone, address, companyName, billingAddress, shippingAddress, gstin, placeOfSupply, customerType } = req.body;
            const customersData = readCustomersData();

            let customer = findCustomer(customersData, req.user);
            let customerIndex = customer ? customersData.customers.findIndex((c: any) => c.id === customer.id) : -1;

            const customerData = {
                name: name || req.user?.name || "Unknown",
                email: req.user?.email,
                phone: phone || "",
                address: address || (billingAddress?.street ? `${billingAddress.street}, ${billingAddress.city}` : ""),
                companyName: companyName || "",
                billingAddress: billingAddress || { street: address || "", city: "", state: "", country: "India", pincode: "" },
                shippingAddress: shippingAddress || billingAddress || { street: address || "", city: "", state: "", country: "India", pincode: "" },
                gstin: gstin || "",
                placeOfSupply: placeOfSupply || "",
                customerType: customerType || "business",
                userId: req.user?.id,
                updatedAt: new Date().toISOString()
            };

            if (customerIndex === -1) {
                // Create new customer profile
                customer = {
                    id: String(customersData.nextCustomerId++),
                    ...customerData,
                    createdAt: new Date().toISOString()
                };
                customersData.customers.push(customer);
            } else {
                // Update existing
                customer = {
                    ...customersData.customers[customerIndex],
                    ...customerData
                };
                customersData.customers[customerIndex] = customer;
            }

            writeCustomersData(customersData);
            res.json({ success: true, message: "Profile updated successfully", data: customer });
        } catch (error) {
            console.error("Profile error:", error);
            res.status(500).json({ success: false, message: "Failed to update profile" });
        }
    });

    // Customer Get Profile
    flowRouter.get('/profile', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const customersData = readCustomersData();
            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                return res.status(404).json({ success: false, message: "Profile not found" });
            }
            res.json({ success: true, data: customer });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch profile" });
        }
    });

    // Customer Request Items
    flowRouter.post('/request', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { items } = req.body;

            const quotesData = readQuotesData();
            const customersData = readCustomersData();

            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                return res.status(400).json({ success: false, message: "Please complete your profile first" });
            }

            const quoteId = String(quotesData.nextQuoteNumber++);
            const total = (items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.rate || 0)), 0);

            const newRequest = {
                id: quoteId,
                quoteNumber: `QT-${quoteId.padStart(6, '0')}`, // Use QT prefix for all quotes
                customerId: customer.id,
                customerName: customer.displayName || customer.name || "Unknown",
                billingAddress: customer.billingAddress || {
                    street: customer.address || "",
                    city: "",
                    state: "",
                    country: "",
                    pincode: ""
                },
                shippingAddress: customer.shippingAddress || customer.billingAddress || {
                    street: customer.address || "",
                    city: "",
                    state: "",
                    country: "",
                    pincode: ""
                },
                organizationId: "1",
                date: new Date().toISOString(),
                status: "Draft",
                items: (items || []).map((item: any, idx: number) => ({
                    id: String(idx + 1),
                    name: item.name,
                    description: item.description || "",
                    quantity: item.quantity || 1,
                    rate: item.rate || 0,
                    amount: (item.quantity || 1) * (item.rate || 0),
                    unit: item.unit || "pcs"
                })),
                subTotal: total,
                total: total,
                createdAt: new Date().toISOString()
            };

            quotesData.quotes.push(newRequest);
            writeQuotesData(quotesData);

            res.json({ success: true, message: "Request received successfully.", data: newRequest });
        } catch (error) {
            console.error("Request error:", error);
            res.status(500).json({ success: false, message: "Failed to process request" });
        }
    });

    // Customer View Quotes
    flowRouter.get('/quotes', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const quotesData = readQuotesData();
            const customersData = readCustomersData();
            const customers = findAllCustomers(customersData, req.user);

            if (customers.length === 0) {
                return res.json({ success: true, data: [] });
            }

            const customerIds = customers.map((c: any) => c.id);
            const myQuotes = quotesData.quotes.filter((q: any) => customerIds.includes(q.customerId));
            res.json({ success: true, data: myQuotes });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch quotes" });
        }
    });

    // Customer Approve Quote
    flowRouter.post('/quotes/:id/approve', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const quotesData = readQuotesData();
            const customersData = readCustomersData();
            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            const quoteIndex = quotesData.quotes.findIndex((q: any) => q.id === id);

            if (quoteIndex === -1) {
                return res.status(404).json({ success: false, message: "Quote not found" });
            }

            const quote = quotesData.quotes[quoteIndex];
            if (quote.customerId !== customer.id) {
                return res.status(403).json({ success: false, message: "Unauthorized: This quote belongs to another customer" });
            }

            // Update status
            quotesData.quotes[quoteIndex].status = "Approved";
            writeQuotesData(quotesData);

            res.json({ success: true, message: "Quote approved successfully", data: quotesData.quotes[quoteIndex] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to approve quote" });
        }
    });

    // Customer Reject Quote
    flowRouter.post('/quotes/:id/reject', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const quotesData = readQuotesData();
            const customersData = readCustomersData();
            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            const quoteIndex = quotesData.quotes.findIndex((q: any) => q.id === id);

            if (quoteIndex === -1) {
                return res.status(404).json({ success: false, message: "Quote not found" });
            }

            const quote = quotesData.quotes[quoteIndex];
            if (quote.customerId !== customer.id) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            // Update status
            quotesData.quotes[quoteIndex].status = "Scrapped";
            writeQuotesData(quotesData);

            res.json({ success: true, message: "Quote scrapped", data: quotesData.quotes[quoteIndex] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to scrap quote" });
        }
    });

    // Admin Scrap Quote
    flowRouter.post('/quotes/:id/scrap', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const quotesData = readQuotesData();
            const quoteIndex = quotesData.quotes.findIndex((q: any) => q.id === id);

            if (quoteIndex === -1) {
                return res.status(404).json({ success: false, message: "Quote not found" });
            }

            quotesData.quotes[quoteIndex].status = "Scrapped";
            writeQuotesData(quotesData);

            res.json({ success: true, message: "Quote marked as scrapped", data: quotesData.quotes[quoteIndex] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to scrap quote" });
        }
    });



    // Customer Get Invoices
    flowRouter.get('/invoices', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const invoicesData = readInvoicesData();
            const customersData = readCustomersData();
            const customers = findAllCustomers(customersData, req.user);

            console.log('=== INVOICE ENDPOINT DEBUG ===');
            console.log('User ID:', req.user?.id);
            console.log('User Email:', req.user?.email);
            console.log('Found Customers:', customers.length);
            console.log('Customer IDs:', customers.map((c: any) => c.id));

            if (customers.length === 0) {
                console.log('No customers found - returning empty array');
                return res.json({ success: true, data: [] });
            }

            const customerIds = customers.map((c: any) => String(c.id));
            // Filter invoices for ANY of these customers
            const myInvoices = invoicesData.invoices.filter((inv: any) => customerIds.includes(String(inv.customerId)));

            console.log('Total invoices in system:', invoicesData.invoices.length);
            console.log('Invoices for these customers:', myInvoices.length);
            console.log('Invoice IDs:', myInvoices.map((inv: any) => inv.invoiceNumber));
            console.log('=== END DEBUG ===');

            res.json({ success: true, data: myInvoices });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch invoices" });
        }
    });

    // Customer Get Invoice Details
    flowRouter.get('/invoices/:id', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const invoicesData = readInvoicesData();
            const customersData = readCustomersData();
            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            const invoice = invoicesData.invoices.find((inv: any) => inv.id === id);

            if (!invoice) {
                return res.status(404).json({ success: false, message: "Invoice not found" });
            }

            if (invoice.customerId !== customer.id) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            res.json({ success: true, data: invoice });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch invoice" });
        }
    });

    // Customer Get Receipts
    flowRouter.get('/receipts', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const paymentsData = readPaymentsReceivedData();
            const customersData = readCustomersData();
            const customers = findAllCustomers(customersData, req.user);

            if (customers.length === 0) {
                return res.json({ success: true, data: [] });
            }

            const customerIds = customers.map((c: any) => c.id);
            // Filter payments for ANY of these customers
            const myReceipts = paymentsData.paymentsReceived.filter((pr: any) => customerIds.includes(pr.customerId));
            res.json({ success: true, data: myReceipts });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch receipts" });
        }
    });

    // Customer Pay Invoice (Manual Verification Flow)
    flowRouter.post('/invoices/:id/pay', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { amount } = req.body;
            const invoicesData = readInvoicesData();
            const customersData = readCustomersData();

            const invoiceIndex = invoicesData.invoices.findIndex((inv: any) => inv.id === id);
            if (invoiceIndex === -1) {
                return res.status(404).json({ success: false, message: "Invoice not found" });
            }

            const invoice = invoicesData.invoices[invoiceIndex];
            const paymentAmount = Number(amount) || invoice.balanceDue || invoice.total;

            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                return res.status(400).json({ success: false, message: "Invalid payment amount" });
            }

            // 1. Create a "Payment Received" entry with PENDING status
            const paymentsReceivedData = readPaymentsReceivedData();
            const newPayment = {
                id: Date.now().toString(),
                paymentNumber: `PAY-${paymentsReceivedData.nextPaymentNumber || 1001}`,
                date: new Date().toISOString(),
                referenceNumber: `INV-PAY-${invoice.invoiceNumber}`,
                customerId: invoice.customerId,
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail || "",
                invoices: [{
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    amountApplied: paymentAmount
                }],
                mode: "Online",
                depositTo: "Undeposited Funds",
                amount: paymentAmount,
                unusedAmount: 0,
                bankCharges: 0,
                tax: "None",
                taxAmount: 0,
                notes: `Online payment recorded by customer for invoice ${invoice.invoiceNumber}`,
                attachments: [],
                sendThankYou: true,
                status: "Pending Verification", // Admin needs to verify
                paymentType: "Customer Payment",
                placeOfSupply: invoice.placeOfSupply || "",
                descriptionOfSupply: "",
                amountInWords: "",
                journalEntries: [],
                createdAt: new Date().toISOString()
            };

            if (!paymentsReceivedData.paymentsReceived) {
                paymentsReceivedData.paymentsReceived = [];
            }
            paymentsReceivedData.paymentsReceived.push(newPayment);
            paymentsReceivedData.nextPaymentNumber = (paymentsReceivedData.nextPaymentNumber || 1001) + 1;
            writePaymentsReceivedData(paymentsReceivedData);

            // 2. Add activity log to invoice
            if (!invoicesData.invoices[invoiceIndex].activityLogs) {
                invoicesData.invoices[invoiceIndex].activityLogs = [];
            }

            invoicesData.invoices[invoiceIndex].activityLogs.push({
                id: String(invoicesData.invoices[invoiceIndex].activityLogs.length + 1),
                timestamp: new Date().toISOString(),
                action: "payment_recorded",
                description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded and awaiting verification`,
                user: req.user?.name || req.user?.email || "Customer"
            });

            writeInvoicesData(invoicesData);

            res.json({
                success: true,
                message: "Payment recorded successfully and is awaiting verification.",
                data: newPayment
            });
        } catch (error) {
            console.error("Payment error:", error);
            res.status(500).json({ success: false, message: "Payment failed" });
        }
    });

    // Customer Request New Item
    flowRouter.post('/item-requests', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { itemName, description, quantity } = req.body;
            console.log("Creating item request:", { itemName, quantity, user: req.user?.email });

            const requestsData = readItemRequestsData();
            const customersData = readCustomersData();

            // Try to find customer by userId first, then email
            let customer = customersData.customers.find((c: any) => c.userId === req.user?.id);
            if (!customer) {
                customer = customersData.customers.find((c: any) => c.email === req.user?.email);
            }

            if (!customer) {
                console.log("Customer not found for item request:", req.user?.email);
                return res.status(400).json({ success: false, message: "Please complete your profile first" });
            }

            const newRequest = {
                id: String(requestsData.nextRequestId || 1),
                customerId: customer.id,
                customerName: customer.name,
                customerEmail: req.user?.email || customer.email, // Use current user email
                companyName: customer.companyName || "",
                contactNumber: customer.phone || "",
                itemName,
                description: description || "",
                quantity: quantity || 1,
                status: "Pending",
                createdAt: new Date().toISOString(),
                rejectionReason: ""
            };

            requestsData.itemRequests.push(newRequest);
            requestsData.nextRequestId = (Number(requestsData.nextRequestId || 1)) + 1;
            writeItemRequestsData(requestsData);

            res.json({ success: true, message: "Item request submitted successfully", data: newRequest });
        } catch (error: any) {
            console.error("Item request error:", error);
            res.status(500).json({ success: false, message: "Failed to submit request: " + error.message });
        }
    });

    // Admin/Super Admin Get Item Requests
    flowRouter.get('/item-requests', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const requestsData = readItemRequestsData();
            const { status } = req.query;

            let filteredRequests = requestsData.itemRequests;
            if (status && status !== 'all') {
                filteredRequests = filteredRequests.filter((r: any) => r.status.toLowerCase() === (status as string).toLowerCase());
            }

            res.json({ success: true, data: filteredRequests });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch requests" });
        }
    });

    // Customer Get My Item Requests
    flowRouter.get('/my-item-requests', authenticate, requireRole(UserRole.CUSTOMER), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const requestsData = readItemRequestsData();
            const customersData = readCustomersData();

            // Log for debugging
            console.log("Fetching requests for user:", req.user?.id, req.user?.email);

            const customer = findCustomer(customersData, req.user);

            if (!customer) {
                console.log("Customer profile not found for user:", req.user?.id);
                // Fallback: search by email directly if findCustomer fails
                const myRequests = requestsData.itemRequests.filter((r: any) =>
                    r.customerEmail === req.user?.email ||
                    String(r.customerId) === String(req.user?.id)
                );
                console.log("Fallback search found:", myRequests.length);
                return res.json({ success: true, data: myRequests });
            }

            console.log("Found customer ID:", customer.id);
            // Check both customer.id and customerEmail for robustness
            const myRequests = requestsData.itemRequests.filter((r: any) =>
                String(r.customerId) === String(customer.id) ||
                r.customerEmail === req.user?.email
            );
            console.log("Found requests count:", myRequests.length);

            res.json({ success: true, data: myRequests });
        } catch (error) {
            console.error("Fetch my requests error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch your requests" });
        }
    });

    // Admin/Super Admin Update Item Request Status
    flowRouter.patch('/item-requests/:id/status', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;

            const requestsData = readItemRequestsData();
            const requestIndex = requestsData.itemRequests.findIndex((r: any) => r.id === id);

            if (requestIndex === -1) {
                return res.status(404).json({ success: false, message: "Request not found" });
            }

            requestsData.itemRequests[requestIndex].status = status;
            if (rejectionReason) {
                requestsData.itemRequests[requestIndex].rejectionReason = rejectionReason;
            }

            // If approved, add to items list
            if (status === "Approved") {
                const request = requestsData.itemRequests[requestIndex];
                const items = readItems();

                const newItem = {
                    id: String(Date.now()),
                    name: request.itemName,
                    description: request.description,
                    type: "goods",
                    usageUnit: "pcs",
                    rate: "0",
                    purchaseRate: "0",
                    taxPreference: "taxable",
                    intraStateTax: "GST18",
                    interStateTax: "IGST18",
                    isActive: true,
                    organizationId: "1",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                items.push(newItem);
                writeItems(items);
            }

            writeItemRequestsData(requestsData);

            res.json({ success: true, message: `Request ${status.toLowerCase()} successfully`, data: requestsData.itemRequests[requestIndex] });
        } catch (error) {
            console.error("Status update error:", error);
            res.status(500).json({ success: false, message: "Failed to update status" });
        }
    });

    return flowRouter;
};
