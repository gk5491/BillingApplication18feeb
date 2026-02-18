import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";

interface PurchasePDFHeaderProps {
  logo?: { url?: string | null };
  documentTitle: string;
  documentNumber: string;
  date: string;
  referenceNumber?: string;
  organization?: Organization;
}

export function PurchasePDFHeader({
  logo,
  documentTitle,
  documentNumber,
  date,
  referenceNumber,
  organization,
}: PurchasePDFHeaderProps) {
  // Use context for organization and branding if not provided
  const { currentOrganization } = useOrganization();
  const { data: branding } = useBranding();

  // Use provided organization or fallback to current organization
  const org = organization || currentOrganization;
  // Use provided logo or fallback to branding logo
  const logoToUse = logo?.url ? logo : branding?.logo;

  // Format date
  const formatDateString = (dateString: string): string => {
    if (!dateString) return '-';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Build address
  const getAddress = (org?: Organization): string[] => {
    if (!org) return [];
    const parts = [];
    if (org.street1) parts.push(org.street1);
    if (org.street2) parts.push(org.street2);
    if (org.city || org.state || org.postalCode) {
      const line = [org.city, org.state, org.postalCode].filter(Boolean).join(', ');
      parts.push(line);
    }
    if (org.country) parts.push(org.country);
    return parts;
  };

  const addressLines = getAddress(org);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginBottom: '48px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Section: Branding and Company Info */}
      <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {logoToUse?.url && (
            <div style={{ padding: '4px', backgroundColor: '#ffffff' }}>
              <img
                src={logoToUse.url}
                alt="Logo"
                style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }}
              />
            </div>
          )}
          <div>
            <h1 style={{
              margin: '0',
              fontSize: '24px',
              fontWeight: '900',
              color: '#0f172a',
              letterSpacing: '-0.04em',
              lineHeight: '1.1'
            }}>
              {org?.name || 'Company Name'}
            </h1>
            {org?.gstin && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '11px',
                fontWeight: '700',
                color: '#991b1b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                GSTIN: {org.gstin}
              </p>
            )}
          </div>
        </div>

        {/* Company Contact Info */}
        <div style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.6',
          paddingLeft: logoToUse?.url ? '0' : '0'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {addressLines.join(', ')}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontWeight: '500' }}>
            {org?.email && <span style={{ color: '#991b1b' }}>{org.email}</span>}
            {org?.website && <span style={{ color: '#991b1b' }}>{org.website}</span>}
          </div>
        </div>
      </div>

      {/* Right Section: Document Metadata Card */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
      }}>
        <div style={{
          backgroundColor: '#991b1b',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(153, 27, 27, 0.1), 0 2px 4px -1px rgba(153, 27, 27, 0.06)',
          marginBottom: '20px',
          textAlign: 'center',
          minWidth: '200px'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '900',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {documentTitle}
          </h2>
        </div>

        <div style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #fee2e2',
          minWidth: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>{documentTitle}#</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{documentNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: referenceNumber ? '8px' : '0' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{formatDateString(date)}</span>
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
