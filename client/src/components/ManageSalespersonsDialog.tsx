import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Salesperson {
    id: string;
    name: string;
    email: string;
}

interface ManageSalespersonsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSalespersonChange?: () => void;
}

export function ManageSalespersonsDialog({ open, onOpenChange, onSalespersonChange }: ManageSalespersonsDialogProps) {
    const { toast } = useToast();
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSalesperson, setNewSalesperson] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSalespersons();
        }
    }, [open]);

    const fetchSalespersons = async () => {
        try {
            const response = await fetch('/api/salespersons');
            if (response.ok) {
                const data = await response.json();
                setSalespersons(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch salespersons:', error);
        }
    };

    const handleAddSalesperson = async () => {
        if (!newSalesperson.name) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/salespersons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSalesperson)
            });

            if (response.ok) {
                toast({ title: "Salesperson added successfully" });
                setNewSalesperson({ name: "", email: "" });
                setShowAddForm(false);
                fetchSalespersons();
                if (onSalespersonChange) onSalespersonChange();
            } else {
                toast({ title: "Failed to add salesperson", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error adding salesperson:', error);
            toast({ title: "Error adding salesperson", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSalesperson = async (id: string) => {
        try {
            const response = await fetch(`/api/salespersons/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast({ title: "Salesperson deleted successfully" });
                fetchSalespersons();
                if (onSalespersonChange) onSalespersonChange();
            } else {
                toast({ title: "Failed to delete salesperson", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error deleting salesperson:', error);
            toast({ title: "Error deleting salesperson", variant: "destructive" });
        }
    };

    const filteredSalespersons = salespersons.filter(sp =>
        sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl z-[9999]">
                <DialogHeader>
                    <DialogTitle>Manage Salespersons</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Salesperson"
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-2" /> New Salesperson
                        </Button>
                    </div>

                    {showAddForm && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name*</label>
                                    <Input
                                        value={newSalesperson.name}
                                        onChange={(e) => setNewSalesperson(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        value={newSalesperson.email}
                                        onChange={(e) => setNewSalesperson(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter email"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddSalesperson} disabled={loading}>Save</Button>
                            </div>
                        </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase">
                            <div className="col-span-1 flex items-center justify-center">
                                <Checkbox />
                            </div>
                            <div className="col-span-5">Salesperson Name</div>
                            <div className="col-span-5">Email</div>
                            <div className="col-span-1"></div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y">
                            {filteredSalespersons.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No salespersons found. Add a new salesperson to get started.
                                </div>
                            ) : (
                                filteredSalespersons.map(sp => (
                                    <div key={sp.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 group">
                                        <div className="col-span-1 flex items-center justify-center">
                                            <Checkbox />
                                        </div>
                                        <div className="col-span-5 text-sm font-medium">{sp.name}</div>
                                        <div className="col-span-5 text-sm text-slate-500">{sp.email}</div>
                                        <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteSalesperson(sp.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
