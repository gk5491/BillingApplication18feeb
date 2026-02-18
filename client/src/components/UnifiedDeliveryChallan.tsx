/**
 * Unified Delivery Challan PDF Component
 * Uses ONLY inline styles to ensure pixel-perfect consistency
 * between preview and downloaded PDF.
 */

import React from 'react';
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";

interface ChallanItem {
    id: string;
    name: string;
    description?: string;
    hsnSac?: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface ChallanDetail {
    id: string;
    challanNumber: string;
    referenceNumber: string;
    date: string;
    customerId: string;
    customerName: string;
    challanType: string;
    billingAddress: any;
    shippingAddress: any;
    placeOfSupply: string;
    gstin: string;
    items: ChallanItem[];
    subTotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    adjustment: number;
    total: number;
    customerNotes: string;
    termsAndConditions: string;
    status: string;
    invoiceStatus: string;
    invoiceId: string | null;
    createdAt: string;
}

function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAddress(address: any): string[] {
    if (!address) return ['-'];
    if (typeof address === 'string') return [address];
    if (typeof address !== 'object') return ['-'];
    const parts = [
        address.street ? String(address.street) : '',
        address.city ? String(address.city) : '',
        address.state ? String(address.state) : '',
        address.country ? String(address.country) : '',
        address.pincode ? String(address.pincode) : ''
    ].filter(Boolean);
    return parts.length > 0 ? parts : ['-'];
}

function getChallanTypeLabel(type: string): string {
    switch (type) {
        case 'supply_on_approval': return 'Supply on Approval';
        case 'supply_for_job_work': return 'Supply for Job Work';
        case 'supply_for_repair': return 'Supply for Repair';
        case 'removal_for_own_use': return 'Removal for Own Use';
        case 'others': return 'Others';
        default: return type || 'Others';
    }
}

export function UnifiedDeliveryChallan({
    challan,
    branding,
    organization,
    isPreview = false
}: {
    challan: ChallanDetail;
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
        <div style={pageStyle} id="delivery-challan-content">
            <div style={containerStyle}>
                {/* Header Section */}
                <div style={{ marginBottom: '40px' }}>
                    <SalesPDFHeader
                        organization={organization}
                        logo={branding?.logo}
                        documentTitle="DELIVERY CHALLAN"
                        documentNumber={challan.challanNumber}
                        date={challan.date}
                    />
                </div>

                {/* Addresses Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '40px' }}>
                    <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            BILL TO
                        </h3>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                            {challan.customerName}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            {formatAddress(challan.billingAddress).map((line, i) => (
                                <p key={i} style={{ margin: '0' }}>{line}</p>
                            ))}
                        </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            SHIP TO
                        </h3>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                            {challan.customerName}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            {formatAddress(challan.shippingAddress).map((line, i) => (
                                <p key={i} style={{ margin: '0' }}>{line}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Meta Information Bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2px',
                    marginBottom: '40px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9'
                }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Challan Date</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(challan.date)}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Challan Type</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0', textTransform: 'uppercase' }}>{getChallanTypeLabel(challan.challanType)}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Reference#</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{challan.referenceNumber || '-'}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HSN/SAC</th>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {challan.items.map((item, index) => (
                                <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>{index + 1}</td>
                                    <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</p>
                                        {item.description && (
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top' }}>{item.hsnSac || '-'}</td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.rate)}</td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700' }}>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Section: Notes and Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px', marginBottom: '40px' }}>
                    {/* Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {challan.customerNotes && (
                            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                                    Customer Notes
                                </h4>
                                <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{challan.customerNotes}</p>
                            </div>
                        )}
                        {challan.termsAndConditions && (
                            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                                    Terms & Conditions
                                </h4>
                                <div style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {challan.termsAndConditions}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Table */}
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
                            <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(challan.subTotal)}</span>
                        </div>
                        {challan.cgst > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                                <span style={{ color: '#64748b', fontWeight: '600' }}>CGST (9.0%)</span>
                                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(challan.cgst)}</span>
                            </div>
                        )}
                        {challan.sgst > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                                <span style={{ color: '#64748b', fontWeight: '600' }}>SGST (9.0%)</span>
                                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(challan.sgst)}</span>
                            </div>
                        )}
                        {challan.igst > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                                <span style={{ color: '#64748b', fontWeight: '600' }}>IGST (18.0%)</span>
                                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(challan.igst)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>{formatCurrency(challan.total)}</span>
                        </div>
                    </div>
                </div>

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
