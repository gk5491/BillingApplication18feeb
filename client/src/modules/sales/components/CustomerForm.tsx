import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Loader2 } from "lucide-react";

export const INDIAN_STATES = [
    { code: "01", name: "Jammu and Kashmir" },
    { code: "02", name: "Himachal Pradesh" },
    { code: "03", name: "Punjab" },
    { code: "04", name: "Chandigarh" },
    { code: "05", name: "Uttarakhand" },
    { code: "06", name: "Haryana" },
    { code: "07", name: "Delhi" },
    { code: "08", name: "Rajasthan" },
    { code: "09", name: "Uttar Pradesh" },
    { code: "10", name: "Bihar" },
    { code: "11", name: "Sikkim" },
    { code: "12", name: "Arunachal Pradesh" },
    { code: "13", name: "Nagaland" },
    { code: "14", name: "Manipur" },
    { code: "15", name: "Mizoram" },
    { code: "16", name: "Tripura" },
    { code: "17", name: "Meghalaya" },
    { code: "18", name: "Assam" },
    { code: "19", name: "West Bengal" },
    { code: "20", name: "Jharkhand" },
    { code: "21", name: "Odisha" },
    { code: "22", name: "Chhattisgarh" },
    { code: "23", name: "Madhya Pradesh" },
    { code: "24", name: "Gujarat" },
    { code: "25", name: "Daman and Diu (Old)" },
    { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
    { code: "27", name: "Maharashtra" },
    { code: "28", name: "Andhra Pradesh (Old)" },
    { code: "29", name: "Karnataka" },
    { code: "30", name: "Goa" },
    { code: "31", name: "Lakshadweep" },
    { code: "32", name: "Kerala" },
    { code: "33", name: "Tamil Nadu" },
    { code: "34", name: "Puducherry" },
    { code: "35", name: "Andaman and Nicobar Islands" },
    { code: "36", name: "Telangana" },
    { code: "37", name: "Andhra Pradesh" },
    { code: "38", name: "Ladakh" },
    { code: "97", name: "Other Territory" },
];

export const GST_TREATMENTS = [
    { value: "registered_regular", label: "Registered Business \u2013 Regular" },
    { value: "registered_composition", label: "Registered Business \u2013 Composition" },
    { value: "unregistered_business", label: "Unregistered Business" },
    { value: "consumer", label: "Consumer" },
    { value: "overseas", label: "Overseas" },
    { value: "sez_unit", label: "Special Economic Zone (SEZ Unit)" },
];

export const customerSchema = z.object({
    customerType: z.enum(["business", "individual"]),
    salutation: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().min(1, "Display Name is required"),
    companyName: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    gstin: z.string().optional(),
    gstTreatment: z.string().optional(),
    placeOfSupply: z.string().optional(),
    pan: z.string().optional(),
    taxPreference: z.enum(["taxable", "tax_exempt"]).default("taxable"),
    exemptionReason: z.string().optional(),
    currency: z.string().default("INR"),
    paymentTerms: z.string().optional(),
    billingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
        attention: z.string().optional(),
        phone: z.string().optional(),
        fax: z.string().optional(),
    }),
    shippingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
        attention: z.string().optional(),
        phone: z.string().optional(),
        fax: z.string().optional(),
    }),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    initialData?: Partial<CustomerFormValues>;
    onSubmit: (data: CustomerFormValues) => void;
    onCancel?: () => void;
    isLoading?: boolean;
    isAdmin?: boolean;
    isEdit?: boolean;
}

export function CustomerForm({ initialData, onSubmit, onCancel, isLoading, isAdmin, isEdit }: CustomerFormProps) {
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            customerType: initialData?.customerType || "business",
            salutation: initialData?.salutation || "",
            firstName: initialData?.firstName || "",
            lastName: initialData?.lastName || "",
            name: initialData?.name || "",
            companyName: initialData?.companyName || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            mobile: initialData?.mobile || "",
            gstin: initialData?.gstin || "",
            gstTreatment: initialData?.gstTreatment || "registered_regular",
            placeOfSupply: initialData?.placeOfSupply || "27",
            pan: initialData?.pan || "",
            taxPreference: initialData?.taxPreference || "taxable",
            exemptionReason: initialData?.exemptionReason || "",
            currency: initialData?.currency || "INR",
            paymentTerms: initialData?.paymentTerms || "due_on_receipt",
            billingAddress: {
                street: initialData?.billingAddress?.street || "",
                city: initialData?.billingAddress?.city || "",
                state: initialData?.billingAddress?.state || "",
                country: initialData?.billingAddress?.country || "India",
                pincode: initialData?.billingAddress?.pincode || "",
                attention: initialData?.billingAddress?.attention || "",
                phone: initialData?.billingAddress?.phone || "",
                fax: initialData?.billingAddress?.fax || "",
            },
            shippingAddress: {
                street: initialData?.shippingAddress?.street || initialData?.billingAddress?.street || "",
                city: initialData?.shippingAddress?.city || initialData?.billingAddress?.city || "",
                state: initialData?.shippingAddress?.state || initialData?.billingAddress?.state || "",
                country: initialData?.shippingAddress?.country || initialData?.billingAddress?.country || "India",
                pincode: initialData?.shippingAddress?.pincode || initialData?.billingAddress?.pincode || "",
                attention: initialData?.shippingAddress?.attention || initialData?.billingAddress?.attention || "",
                phone: initialData?.shippingAddress?.phone || initialData?.billingAddress?.phone || "",
                fax: initialData?.shippingAddress?.fax || initialData?.billingAddress?.fax || "",
            },
        },
    });

    // Track the last loaded ID to avoid unnecessary resets
    const lastLoadedId = React.useRef<string | undefined>(undefined);

    // Reset form when initialData changes (important for profile settings)
    React.useEffect(() => {
        if (!initialData) return;

        const hasData = Object.keys(initialData).length > 0;
        const idChanged = initialData.id !== lastLoadedId.current;
        const isFirstLoad = hasData && lastLoadedId.current === undefined;

        if (idChanged || isFirstLoad) {
            form.reset({
                customerType: initialData.customerType || "business",
                salutation: initialData.salutation || "",
                firstName: initialData.firstName || "",
                lastName: initialData.lastName || "",
                name: initialData.name || "",
                companyName: initialData.companyName || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                mobile: initialData.mobile || "",
                gstin: initialData.gstin || "",
                gstTreatment: initialData.gstTreatment || "registered_regular",
                placeOfSupply: initialData.placeOfSupply || "27",
                pan: initialData.pan || "",
                taxPreference: initialData.taxPreference || "taxable",
                exemptionReason: initialData.exemptionReason || "",
                currency: initialData.currency || "INR",
                paymentTerms: initialData.paymentTerms || "due_on_receipt",
                billingAddress: {
                    street: initialData.billingAddress?.street || "",
                    city: initialData.billingAddress?.city || "",
                    state: initialData.billingAddress?.state || "",
                    country: initialData.billingAddress?.country || "India",
                    pincode: initialData.billingAddress?.pincode || "",
                    attention: initialData.billingAddress?.attention || "",
                    phone: initialData.billingAddress?.phone || "",
                    fax: initialData.billingAddress?.fax || "",
                },
                shippingAddress: {
                    street: initialData.shippingAddress?.street || initialData.billingAddress?.street || "",
                    city: initialData.shippingAddress?.city || initialData.billingAddress?.city || "",
                    state: initialData.shippingAddress?.state || initialData.billingAddress?.state || "",
                    country: initialData.shippingAddress?.country || initialData.billingAddress?.country || "India",
                    pincode: initialData.shippingAddress?.pincode || initialData.billingAddress?.pincode || "",
                    attention: initialData.shippingAddress?.attention || initialData.billingAddress?.attention || "",
                    phone: initialData.shippingAddress?.phone || initialData.billingAddress?.phone || "",
                    fax: initialData.shippingAddress?.fax || initialData.billingAddress?.fax || "",
                },
            });
            lastLoadedId.current = initialData.id || 'LOADED';
        }
    }, [initialData, form]);

    const copyBillingToShipping = () => {
        form.setValue("shippingAddress", form.getValues("billingAddress"));
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-lg">
                        <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-bold font-display uppercase tracking-wider text-[10px]">Basic Info</TabsTrigger>
                        <TabsTrigger value="gst" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-bold font-display uppercase tracking-wider text-[10px]">GST & Settings</TabsTrigger>
                        <TabsTrigger value="address" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-bold font-display uppercase tracking-wider text-[10px]">Address</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 pt-6">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <FormField
                                control={form.control}
                                name="customerType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Type</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-row space-x-6"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="business" /></FormControl>
                                                    <FormLabel className="font-bold text-sm text-slate-700 font-display">Business</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="individual" /></FormControl>
                                                    <FormLabel className="font-bold text-sm text-slate-700 font-display">Individual</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="salutation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salutation</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Mr." /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="mr">Mr.</SelectItem>
                                                    <SelectItem value="mrs">Mrs.</SelectItem>
                                                    <SelectItem value="ms">Ms.</SelectItem>
                                                    <SelectItem value="dr">Dr.</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-5">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</FormLabel>
                                            <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-5">
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</FormLabel>
                                            <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Display Name *</FormLabel>
                                        <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</FormLabel>
                                        <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Email</FormLabel>
                                        <FormControl><Input type="email" {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Phone</FormLabel>
                                            <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</FormLabel>
                                            <FormControl><Input {...field} className="h-10 border-slate-200 focus:ring-sidebar/20" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="gst" className="space-y-6 pt-6">
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-sidebar uppercase tracking-widest mb-6 border-b border-sidebar/10 pb-2">Tax Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="taxPreference"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Preference</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="taxable" /><Label className="text-sm font-bold text-slate-700">Taxable</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="tax_exempt" /><Label className="text-sm font-bold text-slate-700">Tax Exempt</Label></div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="gstTreatment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST Treatment</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select treatment" /></SelectTrigger></FormControl>
                                            <SelectContent>{GST_TREATMENTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="placeOfSupply"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Place of Supply</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                                            <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="gstin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN</FormLabel>
                                        <FormControl><Input {...field} placeholder="27AAGCA4900Q1ZE" className="h-10 border-slate-200" /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PAN</FormLabel>
                                        <FormControl><Input {...field} placeholder="ABCDE1234F" className="h-10 border-slate-200" /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="address" className="space-y-8 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-sidebar">Billing Address</h3>
                                    <Button type="button" variant="ghost" size="sm" onClick={copyBillingToShipping} className="h-7 text-[10px] font-bold text-sidebar hover:bg-sidebar/5 uppercase tracking-tighter">Copy to Shipping</Button>
                                </div>
                                <FormField control={form.control} name="billingAddress.attention" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attention</FormLabel><FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="billingAddress.street" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street</FormLabel><FormControl><Textarea {...field} className="min-h-[80px] border-slate-200" /></FormControl></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="billingAddress.city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</FormLabel>
                                                <FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="billingAddress.state"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="billingAddress.pincode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</FormLabel>
                                                    <FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center border-b border-slate-100 pb-2 h-[36px]">
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-sidebar">Shipping Address</h3>
                                </div>
                                <FormField control={form.control} name="shippingAddress.attention" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attention</FormLabel><FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="shippingAddress.street" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street</FormLabel><FormControl><Textarea {...field} className="min-h-[80px] border-slate-200" /></FormControl></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="shippingAddress.city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</FormLabel>
                                                <FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="shippingAddress.state"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shippingAddress.pincode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</FormLabel>
                                                    <FormControl><Input {...field} className="h-10 border-slate-200" /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-bold uppercase tracking-wider text-[10px] h-10 px-6">Cancel</Button>}
                    <Button type="submit" disabled={isLoading} className="bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 h-10 shadow-sm uppercase tracking-wider text-[10px]">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEdit ? "Update Profile" : "Save Customer")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
