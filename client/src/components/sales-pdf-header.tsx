import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";

interface SalesPDFHeaderProps {
    logo?: { url?: string | null };
    documentTitle: string;
    documentNumber: string;
    date: string;
    referenceNumber?: string;
    organization?: Organization;
}

export function SalesPDFHeader({
    logo,
    documentTitle,
    documentNumber,
    date,
    referenceNumber,
    organization,
}: SalesPDFHeaderProps) {
    // Use context for organization and branding if not provided
    const { currentOrganization } = useOrganization();
    const { data: branding } = useBranding();

    // Use provided organization or fallback to current organization
    const org = organization || currentOrganization || undefined;
    // Use provided logo or fallback to branding logo
    const logoToUse = logo?.url ? logo : branding?.logo;

    // Format date
    const formatDate = (dateString: string): string => {
        if (!dateString) return '-';
        const dateObj = new Date(dateString);
        return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Build full address
    const getFullAddress = (org?: Organization): string[] => {
        if (!org) return [];
        const parts = [];
        if (org.street1) parts.push(org.street1);
        if (org.street2) parts.push(org.street2);
        if (org.city) parts.push(org.city);
        if (org.state) parts.push(org.state);
        if (org.postalCode) parts.push(org.postalCode);
        return parts;
    };

    const addressParts = getFullAddress(org);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'stretch', // Changed to stretch for equal height look
            marginBottom: '48px',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Left Section: Branding and Company Info */}
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Branding */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    {logoToUse?.url && (
                        <div style={{ padding: '4px', backgroundColor: '#ffffff' }}>
                            <img
                                src={logoToUse.url}
                                alt="Logo"
                                style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <h1 style={{
                                            margin: '0',
                                            fontSize: '20px', // Reduced from 24px to prevent wrapping
                                            fontWeight: '900',
                                            color: '#0f172a',
                                            letterSpacing: '-0.04em',
                                            lineHeight: '1.2',
                                            display: 'block',
                                            wordWrap: 'break-word',
                                            whiteSpace: 'normal'
                                        }}>
                                            {org?.name || 'Company Name'}
                                        </h1>
                                    </td>
                                </tr>
                                {org?.gstin && (
                                    <>
                                        <tr><td style={{ height: '8px' }}></td></tr>
                                        <tr>
                                            <td>
                                                <p style={{
                                                    margin: '0',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    color: '#1e40af',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    display: 'block',
                                                    lineHeight: '1.4'
                                                }}>
                                                    GSTIN: {org.gstin}
                                                </p>
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Company Contact Info */}
                <div style={{
                    fontSize: '13px',
                    color: '#475569',
                    lineHeight: '1.8', // Increased line height
                    paddingLeft: logoToUse?.url ? '0' : '0'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {addressParts.join(', ')}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontWeight: '500' }}>
                        {org?.email && <span>{org.email}</span>}
                        {org?.website && <span>{org.website}</span>}
                    </div>
                </div>
            </div>

            {/* Right Section: Document Metadata Card */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'flex-start', // changed from space-between to avoid stretching
                gap: '20px' // Use gap instead
            }}>
                <div style={{
                    backgroundColor: '#1e40af',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.1), 0 2px 4px -1px rgba(30, 64, 175, 0.06)',
                    marginBottom: '0', // Handled by gap
                    textAlign: 'center',
                    minWidth: '200px'
                }}>
                    <h2 style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        margin: '0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        lineHeight: '1.4' // Explicit line height
                    }}>
                        {documentTitle}
                    </h2>
                </div>

                <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #f1f5f9',
                    minWidth: '220px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{documentTitle}#</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{documentNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: referenceNumber ? '8px' : '0' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{formatDate(date)}</span>
                    </div>
                    {referenceNumber && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Ref#</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{referenceNumber}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
