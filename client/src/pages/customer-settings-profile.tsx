import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CustomerForm, CustomerFormValues } from "@/modules/sales/components/CustomerForm";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function CustomerSettingsProfilePage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchLoading, setIsFetchLoading] = useState(true);
    const [profileData, setProfileData] = useState<Partial<CustomerFormValues>>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/flow/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        setProfileData(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsFetchLoading(false);
            }
        };

        if (token) fetchProfile();
        else setIsFetchLoading(false);
    }, [token]);

    const onSubmit = async (data: CustomerFormValues) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/flow/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to update profile");

            toast({
                title: "Success",
                description: "Profile updated successfully"
            });
            setLocation("/customer/profile");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchLoading) {
        return <div className="container mx-auto py-10 text-center">Loading profile...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setLocation("/customer/profile")}
                        className="text-slate-500 hover:text-sidebar"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Edit Profile</h1>
                        <p className="text-xs text-slate-500 font-display uppercase tracking-widest font-bold">Personal Details</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="bg-sidebar-accent/5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-sidebar uppercase tracking-wider font-display">Customer Information</h3>
                        </div>
                        <CardContent className="p-6 bg-white dark:bg-slate-800/50">
                            <CustomerForm
                                initialData={profileData}
                                onSubmit={onSubmit}
                                isLoading={isLoading}
                                isEdit={true}
                            />

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Security</h3>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const newPassword = prompt("Enter new password:");
                                        if (newPassword) {
                                            fetch("/api/auth/reset-password", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ password: newPassword })
                                            })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.success) {
                                                    alert("Password updated successfully");
                                                } else {
                                                    alert(data.message || "Failed to update password");
                                                }
                                            });
                                        }
                                    }}
                                >
                                    Change Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
