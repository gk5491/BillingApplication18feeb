import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
    Plus,
    X,
    Settings,
    FileText,
    Truck,
    Train,
    Plane,
    Ship,
    ExternalLink,
    ChevronDown,
    Check,
    ChevronsUpDown,
    ArrowLeft,
    Trash2,
    Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TransporterSelect } from "@/components/transporter-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Customer {
    id: string;
    displayName: string;
    companyName: string;
    gstin?: string;
    billingAddress?: any;
    shippingAddress?: any;
}

const INDIAN_STATES_WITH_CODES = [
    { code: "AP", name: "Andhra Pradesh" },
    { code: "AR", name: "Arunachal Pradesh" },
    { code: "AS", name: "Assam" },
    { code: "BR", name: "Bihar" },
    { code: "CT", name: "Chhattisgarh" },
    { code: "GA", name: "Goa" },
    { code: "GJ", name: "Gujarat" },
    { code: "HR", name: "Haryana" },
    { code: "HP", name: "Himachal Pradesh" },
    { code: "JH", name: "Jharkhand" },
    { code: "KA", name: "Karnataka" },
    { code: "KL", name: "Kerala" },
    { code: "MP", name: "Madhya Pradesh" },
    { code: "MH", name: "Maharashtra" },
    { code: "MN", name: "Manipur" },
    { code: "ML", name: "Meghalaya" },
    { code: "MZ", name: "Mizoram" },
    { code: "NL", name: "Nagaland" },
    { code: "OR", name: "Odisha" },
    { code: "PB", name: "Punjab" },
    { code: "RJ", name: "Rajasthan" },
    { code: "SK", name: "Sikkim" },
    { code: "TN", name: "Tamil Nadu" },
    { code: "TG", name: "Telangana" },
    { code: "TR", name: "Tripura" },
    { code: "UP", name: "Uttar Pradesh" },
    { code: "UT", name: "Uttarakhand" },
    { code: "WB", name: "West Bengal" },
    { code: "AN", name: "Andaman and Nicobar Islands" },
    { code: "CH", name: "Chandigarh" },
    { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu" },
    { code: "DL", name: "Delhi" },
    { code: "JK", name: "Jammu and Kashmir" },
    { code: "LA", name: "Ladakh" },
    { code: "LD", name: "Lakshadweep" },
    { code: "PY", name: "Puducherry" },
];

const documentTypes = [
    { value: 'credit_notes', label: 'Credit Notes' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'delivery_challans', label: 'Delivery Challans' },
    { value: 'sales_orders', label: 'Sales Orders' },
];

const transactionSubTypes = [
    { value: 'sales_return', label: 'Sales Return' },
    { value: 'supply', label: 'Supply' },
    { value: 'export', label: 'Export' },
    { value: 'job_work', label: 'Job Work' },
];

const transactionTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'bill_to_ship_to', label: 'Bill To - Ship To' },
    { value: 'bill_from_dispatch_from', label: 'Bill From - Dispatch From' },
    { value: 'combination', label: 'Combination of 2 and 3' },
];

const formatCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatAddress = (address: any): string[] => {
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
};

export default function EWayBillEdit() {
    const [, setLocation] = useLocation();
    const { id } = useParams();
    const { toast } = useToast();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        ewayBillNumber: '',
        documentType: 'invoices',
        transactionSubType: 'supply',
        customerId: '',
        customerName: '',
        documentNumber: '',
        documentId: '',
        date: '',
        transactionType: 'regular',
        placeOfDelivery: '',
        transporter: '',
        distance: 0,
        modeOfTransportation: 'road',
        vehicleType: 'regular',
        vehicleNo: '',
        transporterDocNo: '',
        transporterDocDate: '',
        total: 0,
        status: '',
    });

    const [addressData, setAddressData] = useState({
        dispatchFrom: { street: '', city: '', state: '', country: 'India', pincode: '' },
        billFrom: { street: '', city: '', state: '', country: 'India', pincode: '' },
        billTo: { street: '', city: '', state: '', country: 'India', pincode: '' },
        shipTo: { street: '', city: '', state: '', country: 'India', pincode: '' },
    });

    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [placeOfDeliveryOpen, setPlaceOfDeliveryOpen] = useState(false);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds 10MB limit`,
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });
        if (uploadedFiles.length + newFiles.length > 10) {
            toast({
                title: "Too many files",
                description: "Maximum 10 files allowed",
                variant: "destructive",
            });
            return;
        }
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const custRes = await fetch('/api/customers');
            if (custRes.ok) setCustomers((await custRes.json()).data || []);

            const billRes = await fetch(`/api/eway-bills/${id}`);
            if (billRes.ok) {
                const data = (await billRes.json()).data;
                setFormData({
                    ewayBillNumber: data.ewayBillNumber || '',
                    documentType: data.documentType || 'invoices',
                    transactionSubType: data.transactionSubType || 'supply',
                    customerId: data.customerId || '',
                    customerName: data.customerName || '',
                    documentNumber: data.documentNumber || '',
                    documentId: data.documentId || '',
                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
                    transactionType: data.transactionType || 'regular',
                    placeOfDelivery: data.placeOfDelivery || '',
                    transporter: data.transporter || '',
                    distance: data.distance || 0,
                    modeOfTransportation: data.modeOfTransportation || 'road',
                    vehicleType: data.vehicleType || 'regular',
                    vehicleNo: data.vehicleNo || '',
                    transporterDocNo: data.transporterDocNo || '',
                    transporterDocDate: data.transporterDocDate ? new Date(data.transporterDocDate).toISOString().split('T')[0] : '',
                    total: data.total || 0,
                    status: data.status || '',
                });
                setAddressData({
                    dispatchFrom: data.dispatchFrom || addressData.dispatchFrom,
                    billFrom: data.billFrom || addressData.billFrom,
                    billTo: data.billTo || addressData.billTo,
                    shipTo: data.shipTo || addressData.shipTo,
                });
                setSelectedItems(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching bill data:", error);
            toast({ title: "Error", description: "Failed to load E-Way Bill", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerName: customer.displayName || customer.companyName,
            }));
            setAddressData(prev => ({
                ...prev,
                billTo: customer.billingAddress || prev.billTo,
                shipTo: customer.shippingAddress || customer.billingAddress || prev.shipTo,
            }));
        }
    };

    const handleUpdate = async (generate: boolean = false) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                ...addressData,
                status: generate ? 'GENERATED' : formData.status,
            };

            const response = await fetch(`/api/eway-bills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: "E-Way Bill Updated",
                    description: `E-way bill has been updated successfully.`,
                });
                setLocation('/e-way-bills');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update e-way bill.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/eway-bills/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast({ title: "Deleted", description: "E-Way Bill has been deleted." });
                setLocation('/e-way-bills');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete E-Way Bill", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Fixed Header */}
            <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation("/e-way-bills")}
                        className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-[#002e46]">Edit e-Way Bill</h1>
                        <p className="text-xs text-slate-500 font-medium">{formData.ewayBillNumber || 'Draft'}</p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-5xl mx-auto p-6 space-y-6 pb-24">
                    {/* Reuse the same card structure as Create page */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 mb-4 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-base font-semibold">General Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Document Type <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.documentType}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, documentType: val }))}
                                    >
                                        <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Transaction Sub Type <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.transactionSubType}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, transactionSubType: val }))}
                                    >
                                        <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Select sub type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {transactionSubTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Customer Name <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.customerId}
                                        onValueChange={handleCustomerChange}
                                    >
                                        <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.displayName || c.companyName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        className="bg-white border-slate-200 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Transaction Type <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.transactionType}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, transactionType: val }))}
                                    >
                                        <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {transactionTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {/* <div className="mt-6 flex items-center gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-100/50">
                                <Checkbox id="portal" />
                                <Label htmlFor="portal" className="text-sm font-medium text-slate-600 cursor-pointer">
                                    Allow portal access for this customer to view this e-way bill
                                </Label>
                            </div> */}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 mb-4 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-base font-semibold">Address Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Dispatch From</Label>
                                    <div className="text-sm text-slate-700 space-y-0.5">
                                        {formatAddress(addressData.dispatchFrom).map((line, i) => <p key={i}>{line}</p>)}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bill From</Label>
                                    <div className="text-sm text-slate-700 space-y-0.5">
                                        {formatAddress(addressData.billFrom).map((line, i) => <p key={i}>{line}</p>)}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bill To</Label>
                                    <div className="text-sm text-slate-700 space-y-0.5">
                                        {formatAddress(addressData.billTo).map((line, i) => <p key={i}>{line}</p>)}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Ship To</Label>
                                    <div className="text-sm text-slate-700 space-y-0.5">
                                        {formatAddress(addressData.shipTo).map((line, i) => <p key={i}>{line}</p>)}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Label>Place of Delivery <span className="text-red-500">*</span></Label>
                                <Popover open={placeOfDeliveryOpen} onOpenChange={setPlaceOfDeliveryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal bg-white"
                                        >
                                            {formData.placeOfDelivery || "Select state"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search state..." />
                                            <CommandList>
                                                <CommandEmpty>No state found.</CommandEmpty>
                                                <CommandGroup>
                                                    {INDIAN_STATES_WITH_CODES.map((state) => (
                                                        <CommandItem
                                                            key={state.code}
                                                            value={`${state.code} ${state.name}`}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, placeOfDelivery: `[${state.code}] - ${state.name}` });
                                                                setPlaceOfDeliveryOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", formData.placeOfDelivery === `[${state.code}] - ${state.name}` ? "opacity-100" : "opacity-0")} />
                                                            [{state.code}] - {state.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 mb-4 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-base font-semibold">Transportation Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Transporter Name</Label>
                                <TransporterSelect
                                    value={formData.transporter}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, transporter: val }))}
                                    placeholder="Select or enter transporter"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Distance (Km) <span className="text-red-500">*</span></Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.distance}
                                            onChange={(e) => setFormData(prev => ({ ...prev, distance: parseInt(e.target.value) || 0 }))}
                                            className="bg-white border-slate-200"
                                        />
                                        <a href="#" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                            Calculate Distance <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mode of Transportation</Label>
                                    <Tabs value={formData.modeOfTransportation} onValueChange={(val) => setFormData(prev => ({ ...prev, modeOfTransportation: val }))}>
                                        <TabsList className="grid grid-cols-4 w-full bg-transparent p-0 h-auto gap-2">
                                            <TabsTrigger
                                                value="road"
                                                title="Road"
                                                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
                                            >
                                                <Truck className="h-4 w-4" />
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="rail"
                                                title="Rail"
                                                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
                                            >
                                                <Train className="h-4 w-4" />
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="air"
                                                title="Air"
                                                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
                                            >
                                                <Plane className="h-4 w-4" />
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="ship"
                                                title="Ship"
                                                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
                                            >
                                                <Ship className="h-4 w-4" />
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label className={formData.modeOfTransportation !== 'road' ? "text-slate-400" : ""}>Vehicle No</Label>
                                    <Input
                                        value={formData.vehicleNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleNo: e.target.value }))}
                                        placeholder={formData.modeOfTransportation !== 'road' ? "Not required for non-road" : "e.g. MH-12-AB-1234"}
                                        className="bg-white border-slate-200 uppercase disabled:bg-slate-50 disabled:text-slate-400"
                                        disabled={formData.modeOfTransportation !== 'road'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>
                                        {formData.modeOfTransportation === 'rail' ? 'Rail Receipt No' :
                                            formData.modeOfTransportation === 'air' ? 'Airway Bill No' :
                                                formData.modeOfTransportation === 'ship' ? 'Bill of Lading No' :
                                                    'Transporter Doc No'}
                                    </Label>
                                    <Input
                                        value={formData.transporterDocNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, transporterDocNo: e.target.value }))}
                                        className="bg-white border-slate-200"
                                        placeholder={
                                            formData.modeOfTransportation === 'rail' ? 'Enter Rail Receipt No' :
                                                formData.modeOfTransportation === 'air' ? 'Enter Airway Bill No' :
                                                    formData.modeOfTransportation === 'ship' ? 'Enter Bill of Lading No' :
                                                        'Enter Transporter Doc No'
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>
                                        {formData.modeOfTransportation === 'rail' ? 'Rail Receipt Date' :
                                            formData.modeOfTransportation === 'air' ? 'Airway Bill Date' :
                                                formData.modeOfTransportation === 'ship' ? 'Bill of Lading Date' :
                                                    'Transporter Doc Date'}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={formData.transporterDocDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, transporterDocDate: e.target.value }))}
                                        className="bg-white border-slate-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-slate-900">Documents</Label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 group transition-colors cursor-pointer ${isDragging
                                ? "border-blue-500 bg-blue-100"
                                : "border-blue-200 bg-blue-50/20 hover:bg-blue-50"
                                }`}
                            onClick={() => document.getElementById("file-upload-eway-edit")?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            data-testid="dropzone-documents"
                        >
                            <input
                                id="file-upload-eway-edit"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                data-testid="input-file-upload"
                            />
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-900">
                                    <span className="text-blue-600">Upload files</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Up to 10 files (max 10MB each)</p>
                            </div>
                        </div>
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                                        data-testid={`file-item-${index}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                                            data-testid={`button-remove-file-${index}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedItems.length > 0 && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="py-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-base font-semibold">Item Details</CardTitle>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setItemDetailsOpen(!itemDetailsOpen)}>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", itemDetailsOpen && "rotate-180")} />
                                </Button>
                            </CardHeader>
                            {itemDetailsOpen && (
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                                                <tr>
                                                    <th className="py-3 px-4 text-left font-medium">Item & Description</th>
                                                    <th className="py-3 px-4 text-left font-medium whitespace-nowrap">HSN Code</th>
                                                    <th className="py-3 px-4 text-right font-medium">Quantity</th>
                                                    <th className="py-3 px-4 text-right font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedItems.map((item, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="py-3 px-4">
                                                            <p className="font-medium text-slate-900">{item.itemName || item.name}</p>
                                                            <p className="text-xs text-slate-500">{item.description}</p>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600">{item.hsnSac || '-'}</td>
                                                        <td className="py-3 px-4 text-right text-slate-700">{item.quantity} {item.unit}</td>
                                                        <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(item.amount || item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-slate-50 flex justify-end gap-8 border-t border-slate-100">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(formData.total)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}
                </div>
            </ScrollArea>

            {/* Bottom Action Bar */}
            <div className="flex-none bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
                <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setLocation("/e-way-bills")} disabled={isSubmitting} className="border-slate-200">
                        Cancel
                    </Button>
                    <Button onClick={() => handleUpdate(false)} disabled={isSubmitting} className="bg-[#002e46] hover:bg-[#001f2f] text-white font-semibold shadow-sm">
                        Update
                    </Button>
                    {formData.status !== 'GENERATED' && (
                        <Button onClick={() => handleUpdate(true)} disabled={isSubmitting} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                            Update and Generate
                        </Button>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete E-Way Bill</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this e-way bill? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
// wdew