/**
 * Unified PDF Receipt Component
 * This component uses ONLY inline styles to ensure pixel-perfect consistency
 * between preview and downloaded PDF. No Tailwind classes.
 */

import React from 'react';
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";

interface JournalEntry {
    account: string;
    debit: number;
    credit: number;
}

interface PaymentReceived {
    id: string;
    paymentNumber: string;
    date: string;
    referenceNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    invoices: any[];
    mode: string;
    depositTo: string;
    amount: number;
    unusedAmount: number;
    bankCharges: number;
    tax: string;
    taxAmount: number;
    notes: string;
    attachments: string[];
    sendThankYou: boolean;
    status: string;
    paymentType: string;
    placeOfSupply: string;
    descriptionOfSupply: string;
    amountInWords: string;
    journalEntries: JournalEntry[];
    createdAt: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function UnifiedPaymentReceipt({
    payment,
    branding,
    organization,
    isPreview = false
}: {
    payment: PaymentReceived;
    branding?: any;
    organization?: any;
    isPreview?: boolean;
}) {
    // Fixed A4 dimensions
    const pageStyle: React.CSSProperties = {
        width: isPreview ? '100%' : '210mm',
        maxWidth: '210mm',
        minHeight: '296mm',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
    };

    const containerStyle: React.CSSProperties = {
        padding: '40px',
        color: '#0f172a',
    };

    return (
        <div style={pageStyle} id="payment-receipt-content">
            <div style={containerStyle}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <SalesPDFHeader
                        organization={organization}
                        logo={branding?.logo}
                        documentTitle="PAYMENT RECEIPT"
                        documentNumber={payment.paymentNumber}
                        date={payment.date}
                    />
                </div>

                {/* Received From & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10" style={{ display: 'grid', marginBottom: '40px' }}>
                    <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            RECEIVED FROM
                        </h4>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                            {payment.customerName}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            <p style={{ margin: '0' }}>{payment.customerEmail}</p>
                            <p style={{ margin: '0' }}>{payment.placeOfSupply || 'Place of Supply Not Specified'}</p>
                        </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            PAYMENT TO
                        </h4>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                            {organization?.name || 'Your Company'}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            <p style={{ margin: '0' }}>{organization?.street1 || ''} {organization?.city || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Meta Information Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
                    marginBottom: '40px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #f1f5f9'
                }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Date</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(payment.date)}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Reference#</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{payment.referenceNumber || '-'}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Mode</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0', textTransform: 'uppercase' }}>{payment.mode}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px', borderLeft: '2px solid #f1f5f9' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Amount Received</p>
                        <p style={{ fontSize: '16px', fontWeight: '900', color: '#16a34a', margin: '0' }}>{formatCurrency(payment.amount)}</p>
                    </div>
                </div>

                {/* Invoices Table */}
                {payment.invoices && payment.invoices.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', margin: '0 0 16px 0' }}>
                            PAYMENT FOR
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
                                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>Invoice Number</th>
                                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Date</th>
                                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Invoice Amount</th>
                                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payment.invoices.map((invoice: any, index: number) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{invoice.invoiceNumber || '-'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{invoice.date ? formatDate(invoice.date) : '-'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{formatCurrency(invoice.total || invoice.amount || 0)}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#16a34a', textAlign: 'right' }}>{formatCurrency(invoice.paidAmount || invoice.paymentAmount || invoice.amount || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Overpayment Stats */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <div style={{
                        width: '320px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Amount</span>
                        <span style={{ fontSize: '18px', color: '#0f172a', fontWeight: '900' }}>{formatCurrency(payment.unusedAmount || 0)}</span>
                    </div>
                </div>

                {/* Amount in Words */}
                {payment.amountInWords && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #1e40af',
                        marginBottom: '40px'
                    }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                            Amount In Words
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', fontStyle: 'italic', margin: '0' }}>
                            {payment.amountInWords} Only
                        </p>
                    </div>
                )}

                {/* Signature Section */}
                <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                    <div>
                        {branding?.signature?.url ? (
                            <img
                                src={branding.signature.url}
                                alt="Signature"
                                style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }}
                            />
                        ) : (
                            <div style={{ height: '80px', width: '200px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}></div>
                        )}
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
                            Authorized Signature
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
