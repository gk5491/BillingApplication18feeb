import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Organization } from "@shared/schema";

interface OrganizationContextType {
    organizations: Organization[];
    currentOrganization: Organization | null;
    isLoading: boolean;
    setCurrentOrganization: (orgId: string) => void;
    refreshOrganizations: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
        return localStorage.getItem("organizationId") || "1";
    });

    const { data: organizationsResponse, isLoading, refetch } = useQuery<{ success: boolean, data: Organization[] }>({
        queryKey: ["/api/organizations"],
        staleTime: Infinity, // Only refetch when explicitly asked
    });

    const organizations = organizationsResponse?.data || [];

    const currentOrganization = organizations.find((o) => o.id === currentOrgId) || organizations[0] || null;

    useEffect(() => {
        if (currentOrganization && currentOrganization.id !== currentOrgId) {
            // If the stored ID doesn't exist, fallback to the first one
            setCurrentOrgId(currentOrganization.id);
            localStorage.setItem("organizationId", currentOrganization.id);
        }
    }, [organizations, currentOrgId, currentOrganization]);

    const handleSetOrganization = (orgId: string) => {
        setCurrentOrgId(orgId);
        localStorage.setItem("organizationId", orgId);
        // Invalidate all queries to force refetch with new org ID
        queryClient.invalidateQueries();
        toast({
            title: "Organization Switched",
            description: `Switched to ${organizations.find(o => o.id === orgId)?.name}`,
        });
    };

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                currentOrganization,
                isLoading,
                setCurrentOrganization: handleSetOrganization,
                refreshOrganizations: refetch,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error("useOrganization must be used within an OrganizationProvider");
    }
    return context;
}
