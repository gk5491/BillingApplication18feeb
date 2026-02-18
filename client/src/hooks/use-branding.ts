import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface BrandingLogo {
  url: string;
  fileName: string;
  uploadedAt: string;
  fileSize: number;
}

export interface BrandingSignature {
  url: string;
  fileName: string;
  uploadedAt: string;
  fileSize: number;
}

export interface OrganizationBranding {
  id: string;
  logo: BrandingLogo | null;
  signature: BrandingSignature | null;
  icon?: BrandingLogo | null;
  createdAt: string;
  updatedAt: string;
}

export function useBranding() {
  return useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const response = await fetch("/api/branding");
      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch branding");
      return data.data as OrganizationBranding;
    },
  });
}

export async function fetchBranding(): Promise<OrganizationBranding> {
  const response = await fetch("/api/branding");
  const data = await response.json();
  if (!data.success) throw new Error("Failed to fetch branding");
  return data.data;
}
