import React from "react";
import { SalesPDFHeader } from "@/components/sales-pdf-header";

interface InvoiceDetail {
    invoiceNumber: string;
    referenceNumber?: string;
    date: string;
    dueDate: string;
    customerName: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    placeOfSupply?: string;
    paymentTerms?: string;
    items?: any[];
    subTotal?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total: number;
    amountPaid?: number;
    balanceDue: number;
    customerNotes?: string;
    termsAndConditions?: string;
}

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatAddress = (address: any) => {
    if (!address) return ['-'];
    const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
    return parts.length > 0 ? parts : ['-'];
};

export const InvoicePDFView = ({ invoice, branding, organization }: { invoice: any, branding: any, organization: any }) => {
    return (
        <div id="invoice-pdf-inner" className="bg-white" style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#0f172a',
            padding: '20px',
            margin: '0',
            width: '100%',
            boxSizing: 'border-box',
            lineHeight: '1.5'
        }}>
            {/* Header Section */}
            <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
                <SalesPDFHeader
                    logo={branding?.logo || undefined}
                    documentTitle="INVOICE"
                    documentNumber={invoice.invoiceNumber}
                    date={invoice.date}
                    referenceNumber={invoice.referenceNumber}
                    organization={organization || undefined}
                />
            </div>

            {/* Bill To and Details Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8" style={{ display: 'grid', marginBottom: '30px' }}>
                <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '15px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                        BILL TO
                    </h3>
                    <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                        {invoice.customerName}
                    </p>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                        {formatAddress(invoice.billingAddress).map((line, i) => (
                            <p key={i} style={{ margin: '0' }}>{line}</p>
                        ))}
                    </div>
                </div>

                <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '15px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                        SHIP TO
                    </h3>
                    <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                        {invoice.customerName}
                    </p>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                        {formatAddress(invoice.shippingAddress || invoice.billingAddress).map((line, i) => (
                            <p key={i} style={{ margin: '0' }}>{line}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Meta Information Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] mb-8 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
                marginBottom: '30px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #f1f5f9',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'
            }}>
                <div style={{ backgroundColor: '#ffffff', padding: '12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Invoice Date</p>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(invoice.date)}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Terms</p>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{invoice.paymentTerms || 'Due on Receipt'}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Due Date</p>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#b91c1c', margin: '0' }}>{formatDate(invoice.dueDate)}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Place of Supply</p>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{invoice.placeOfSupply || '-'}</p>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '25px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
                            <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
                            <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
                            <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                            <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(invoice.items || []).map((item: any, index: number) => (
                            <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', fontSize: '12px', color: '#64748b', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' }}>{index + 1}</td>
                                <td style={{ padding: '12px', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>{item.name}</p>
                                    {item.description && (
                                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
                                    )}
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>{item.quantity}</td>
                                <td style={{ padding: '12px', fontSize: '12px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(item.rate)}</td>
                                <td style={{ padding: '12px', fontSize: '12px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section: Notes and Summary */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 mb-8" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', marginBottom: '30px' }}>
                {/* Notes & Terms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {invoice.customerNotes && (
                        <div style={{ backgroundColor: '#fdfdfd', padding: '12px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', margin: '0 0 6px 0' }}>
                                Customer Notes
                            </h4>
                            <p style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.5' }}>{invoice.customerNotes}</p>
                        </div>
                    )}
                    {invoice.termsAndConditions && (
                        <div style={{ backgroundColor: '#fdfdfd', padding: '12px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', margin: '0 0 6px 0' }}>
                                Terms & Conditions
                            </h4>
                            <div style={{ fontSize: '11px', color: '#475569', margin: '0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {invoice.termsAndConditions}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Table */}
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '15px', border: '1px solid #f1f5f9', alignSelf: 'start', minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
                        <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(invoice.subTotal || invoice.total)}</span>
                    </div>
                    {invoice.cgst > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>CGST</span>
                            <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(invoice.cgst)}</span>
                        </div>
                    )}
                    {invoice.sgst > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>SGST</span>
                            <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(invoice.sgst)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #e2e8f0' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Total</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e40af' }}>{formatCurrency(invoice.total)}</span>
                    </div>
                    {invoice.amountPaid > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#16a34a' }}>
                            <span style={{ fontWeight: '600' }}>Payment Made</span>
                            <span style={{ fontWeight: '700' }}>(-) {formatCurrency(invoice.amountPaid)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Balance Due</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#b91c1c' }}>{formatCurrency(invoice.balanceDue)}</span>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            {branding?.signature?.url && (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                    <div>
                        <img
                            src={branding.signature.url}
                            alt="Authorized Signature"
                            style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain', marginBottom: '6px' }}
                        />
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                            Authorized Signature
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
