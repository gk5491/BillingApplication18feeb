import React, { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Building2, Trash2, Check, Edit2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const INDUSTRIES = [
    "Agency or Sales House", "Agriculture", "Art & Design", "Automotive", "Construction",
    "Consulting", "CPG", "Education", "Engineering", "Entertainment", "Financial Services",
    "Food Services", "Gaming", "Government", "Health Care", "Interior Design", "Internal",
    "Legal", "Manufacturing", "Marketing", "Mining & Logistics", "Non-Profit",
    "Publishing & Web Media", "Real Estate", "Retail", "Services", "Technology",
    "Telecommunications", "Travel/Hospitality", "Web Designing", "Web Development", "Writers"
];

const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const CURRENCIES = [
    { code: "INR", name: "Indian Rupee" },
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
];

const LANGUAGES = [
    "English", "Hindi", "Bengali", "Telugu", "Marathi",
    "Tamil", "Gujarati", "Urdu", "Kannada", "Malayalam"
];

const TIMEZONES = [
    "IST (Asia/Kolkata)",
    "PST (America/Los_Angeles)",
    "EST (America/New_York)",
    "GMT (Europe/London)",
    "CET (Europe/Paris)",
];

interface FormData {
    id?: string;
    name: string;
    email?: string;
    industry: string;
    location: string;
    state?: string;
    street1?: string;
    street2?: string;
    city?: string;
    postalCode?: string;
    currency?: string;
    language?: string;
    timezone?: string;
    gstRegistered?: boolean;
    gstin?: string;
    note?: string;
}

export default function SettingsOrganizations() {
    const { organizations, currentOrganization, setCurrentOrganization, refreshOrganizations } = useOrganization();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    const initialFormData: FormData = {
        name: "",
        email: "",
        industry: "",
        location: "India",
        state: "",
        street1: "",
        street2: "",
        city: "",
        postalCode: "",
        currency: "INR",
        language: "English",
        timezone: "IST (Asia/Kolkata)",
        gstRegistered: false,
        gstin: "",
        note: "",
    };

    const [formData, setFormData] = useState<FormData>(initialFormData);

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const res = await apiRequest("POST", "/api/organizations", data);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Organization created successfully" });
            setIsDialogOpen(false);
            refreshOrganizations();
            setFormData(initialFormData);
        },
        onError: () => {
            toast({ title: "Failed to create organization", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const res = await apiRequest("PUT", `/api/organizations/${data.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Organization updated successfully" });
            setIsDialogOpen(false);
            setEditingId(null);
            refreshOrganizations();
            setFormData(initialFormData);
        },
        onError: () => {
            toast({ title: "Failed to update organization", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/organizations/${id}`);
        },
        onSuccess: () => {
            toast({ title: "Organization deleted" });
            refreshOrganizations();
        },
        onError: (error: any) => {
            toast({ title: "Failed to delete organization", description: error.message, variant: "destructive" });
        },
    });

    const handleOpenDialog = (org?: any) => {
        if (org) {
            setEditingId(org.id);
            setFormData({
                id: org.id,
                name: org.name,
                email: org.email || "",
                industry: org.industry,
                location: org.location,
                state: org.state || "",
                street1: org.street1 || "",
                street2: org.street2 || "",
                city: org.city || "",
                postalCode: org.postalCode || "",
                currency: org.currency || "INR",
                language: org.language || "English",
                timezone: org.timezone || "IST (Asia/Kolkata)",
                gstRegistered: org.gstRegistered || false,
                gstin: org.gstin || "",
                note: org.note || "",
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.industry || !formData.location) {
            toast({ title: "Please fill in all required fields", variant: "destructive" });
            return;
        }
        if (formData.gstRegistered && !formData.gstin) {
            toast({ title: "GSTIN is required when GST is enabled", variant: "destructive" });
            return;
        }

        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground">Manage your organizations and business profiles</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Organization" : "Add New Organization"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {/* Organizational Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">ORGANIZATIONAL DETAILS</h3>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Organization Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. My Company"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email || ""}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g. contact@company.com"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="industry">Industry *</Label>
                                        <Select
                                            value={formData.industry}
                                            onValueChange={(value) => setFormData({ ...formData, industry: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INDUSTRIES.map((ind) => (
                                                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="location">Organization Location *</Label>
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g. India"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State/Union Territory</Label>
                                        <Select value={formData.state || ""} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select State/Union Territory" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATES.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="street1">Street 1</Label>
                                        <Input
                                            id="street1"
                                            value={formData.street1 || ""}
                                            onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                                            placeholder="Street address line 1"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="street2">Street 2</Label>
                                        <Input
                                            id="street2"
                                            value={formData.street2 || ""}
                                            onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                                            placeholder="Street address line 2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={formData.city || ""}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="postalCode">Postal Code</Label>
                                            <Input
                                                id="postalCode"
                                                value={formData.postalCode || ""}
                                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                                placeholder="Postal code"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Regional Settings */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">REGIONAL SETTINGS</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select value={formData.currency || "INR"} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CURRENCIES.map((c) => (
                                                        <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="language">Language</Label>
                                            <Select value={formData.language || "English"} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LANGUAGES.map((l) => (
                                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="timezone">Time Zone</Label>
                                        <Select value={formData.timezone || "IST (Asia/Kolkata)"} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONES.map((tz) => (
                                                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Is this business registered for GST?</Label>
                                        </div>
                                        <Switch
                                            checked={formData.gstRegistered || false}
                                            onCheckedChange={(checked) => setFormData({ ...formData, gstRegistered: checked })}
                                        />
                                    </div>

                                    {formData.gstRegistered && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="gstin">GSTIN *</Label>
                                            <Input
                                                id="gstin"
                                                value={formData.gstin || ""}
                                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                                placeholder="Enter your GSTIN"
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="note">Note</Label>
                                        <Textarea
                                            id="note"
                                            value={formData.note || ""}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            placeholder="Add any additional notes"
                                            className="min-h-24"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? "Update Organization" : "Create Organization"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org: any) => (
                    <Card key={org.id} className={currentOrganization?.id === org.id ? "border-primary" : ""}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                {org.name}
                            </CardTitle>
                            {currentOrganization?.id === org.id && (
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Active
                                </span>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground mt-2">
                                <div className="flex justify-between">
                                    <span>Industry:</span>
                                    <span className="font-medium text-foreground">{org.industry}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Location:</span>
                                    <span className="font-medium text-foreground">{org.location}</span>
                                </div>
                                {org.city && (
                                    <div className="flex justify-between">
                                        <span>City:</span>
                                        <span className="font-medium text-foreground">{org.city}</span>
                                    </div>
                                )}
                                {org.email && (
                                    <div className="flex justify-between">
                                        <span>Email:</span>
                                        <span className="font-medium text-foreground">{org.email}</span>
                                    </div>
                                )}
                                {org.currency && (
                                    <div className="flex justify-between">
                                        <span>Currency:</span>
                                        <span className="font-medium text-foreground">{org.currency}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>GST Registered:</span>
                                    <span className="font-medium text-foreground">{org.gstRegistered ? "Yes" : "No"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                {currentOrganization?.id !== org.id && (
                                    <Button
                                        className="flex-1"
                                        variant="default"
                                        onClick={() => setCurrentOrganization(org.id)}
                                    >
                                        Switch to this Org
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleOpenDialog(org)}
                                    data-testid={`button-edit-org-${org.id}`}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                {organizations.length > 1 && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
                                                deleteMutation.mutate(org.id);
                                            }
                                        }}
                                        data-testid={`button-delete-org-${org.id}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}