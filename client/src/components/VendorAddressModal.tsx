import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface AddressData {
    attention?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    countryRegion?: string;
    phone?: string;
    faxNumber?: string;
}

interface VendorAddressModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (address: AddressData) => void;
    title: string;
    initialAddress?: AddressData;
}

const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Himachal Pradesh",
    "Haryana",
    "Jharkhand",
    "Jammu and Kashmir",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Maharashtra",
    "Meghalaya",
    "Manipur",
    "Madhya Pradesh",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Puducherry",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Tripura",
    "Telangana",
    "Uttarakhand",
    "Uttar Pradesh",
    "West Bengal"
];

export function VendorAddressModal({ open, onClose, onSave, title, initialAddress }: VendorAddressModalProps) {
    const [formData, setFormData] = useState<AddressData>({
        attention: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        pinCode: "",
        countryRegion: "India",
        phone: "",
        faxNumber: ""
    });

    useEffect(() => {
        if (initialAddress) {
            setFormData({
                attention: initialAddress.attention || "",
                street1: initialAddress.street1 || "",
                street2: initialAddress.street2 || "",
                city: initialAddress.city || "",
                state: initialAddress.state || "",
                pinCode: initialAddress.pinCode || "",
                countryRegion: initialAddress.countryRegion || "India",
                phone: (initialAddress as any).phone || "",
                faxNumber: (initialAddress as any).faxNumber || ""
            });
        }
    }, [initialAddress, open]);

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Attention */}
                    <div className="space-y-2">
                        <Label htmlFor="attention" className="text-sm font-medium">Attention</Label>
                        <Input
                            id="attention"
                            value={formData.attention}
                            onChange={(e) => setFormData({ ...formData, attention: e.target.value })}
                            placeholder="Enter attention"
                        />
                    </div>

                    {/* Country/Region */}
                    <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium">Country/Region</Label>
                        <Select value={formData.countryRegion} onValueChange={(value) => setFormData({ ...formData, countryRegion: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                        <Textarea
                            id="address"
                            value={formData.street1}
                            onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                            placeholder="Enter street address"
                            className="min-h-20"
                        />
                    </div>

                    {/* Address Line 2 */}
                    <div className="space-y-2">
                        <Textarea
                            value={formData.street2}
                            onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                            placeholder="Address line 2 (optional)"
                            className="min-h-20"
                        />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">City</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Enter city"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* State */}
                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium">State</Label>
                            <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48">
                                    {INDIAN_STATES.map((state) => (
                                        <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pin Code */}
                        <div className="space-y-2">
                            <Label htmlFor="pincode" className="text-sm font-medium">Pin Code</Label>
                            <Input
                                id="pincode"
                                value={formData.pinCode}
                                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                placeholder="Enter pin code"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone"
                            />
                        </div>

                        {/* Fax Number */}
                        <div className="space-y-2">
                            <Label htmlFor="fax" className="text-sm font-medium">Fax Number</Label>
                            <Input
                                id="fax"
                                value={formData.faxNumber}
                                onChange={(e) => setFormData({ ...formData, faxNumber: e.target.value })}
                                placeholder="Enter fax number"
                            />
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 mt-4">
                        <strong>Note:</strong> Changes made here will be updated for this vendor.
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}