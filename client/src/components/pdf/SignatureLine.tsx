import { useBranding } from "@/hooks/use-branding";

interface SignatureLineProps {
    className?: string;
}

export function SignatureLine({ className = "" }: SignatureLineProps) {
    const { data: brandingData } = useBranding();

    if (brandingData?.signature?.url) {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <img
                    src={brandingData.signature.url}
                    alt="Authorized Signature"
                    style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
                />
                <p className="text-xs text-muted-foreground">Authorized Signature</p>
            </div>
        );
    }

    return (
        <p className="text-sm text-slate-600">Authorized Signature ____________________</p>
    );
}
