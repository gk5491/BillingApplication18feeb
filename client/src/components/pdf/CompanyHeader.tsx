interface CompanyHeaderProps {
    brandingLogo?: { url: string } | null;
    companyName?: string;
    className?: string;
    logoClassName?: string;
}

export function CompanyHeader({
    brandingLogo,
    companyName = "Company Name",
    className = "",
    logoClassName = "w-auto mb-5"
}: CompanyHeaderProps) {

    if (brandingLogo?.url) {
        return (
            <div className={className}>
                <img
                    src={brandingLogo.url}
                    alt="Company Logo"
                    style={{ height: "800px", width: "auto" }}
                    className={logoClassName}
                    data-testid="img-company-logo"
                />
            </div>
        );
    }

    // Fallback when no logo is available
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">{companyName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{companyName}</span>
        </div>
    );
}
