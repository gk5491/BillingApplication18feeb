import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Transporter {
  id: string;
  name: string;
  transporterId: string;
}

interface TransporterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  data_testid?: string;
}

export function TransporterSelect({
  value,
  onValueChange,
  placeholder = "Select the transporter's name",
  data_testid = "select-transporter",
}: TransporterSelectProps) {
  const { toast } = useToast();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", transporterId: "" });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    transporterId?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    try {
      const response = await fetch("/api/transporters");
      if (response.ok) {
        const data = await response.json();
        setTransporters(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch transporters:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    if (!formData.name.trim()) {
      errors.name = "Transporter Name is required";
    }
    if (!formData.transporterId.trim()) {
      errors.transporterId = "Transporter ID is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTransporter = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/transporters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          transporterId: formData.transporterId.trim(),
        }),
      });

      if (response.ok) {
        const newTransporter = await response.json();
        setTransporters([...transporters, newTransporter.data]);
        onValueChange(newTransporter.data.id);
        
        toast({
          title: "Transporter Created",
          description: `${formData.name} has been added successfully.`,
        });

        setFormData({ name: "", transporterId: "" });
        setValidationErrors({});
        setShowCreateModal(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to create transporter.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transporter.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTransporter = transporters.find((t) => t.id === value);

  return (
    <>
      <div className="space-y-2">
        <Label>Transporter</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger data-testid={data_testid}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading transporters...
                  </div>
                ) : transporters.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No transporters available
                  </div>
                ) : (
                  transporters.map((transporter) => (
                    <SelectItem key={transporter.id} value={transporter.id}>
                      {transporter.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1"
            data-testid="button-create-transporter"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]" data-testid="modal-create-transporter">
          <DialogHeader>
            <DialogTitle>Manage Transporters</DialogTitle>
            <DialogDescription>
              Add a new transporter to your system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transporter-name" className="text-slate-700">
                <span className="text-red-500">*</span> Name
              </Label>
              <Input
                id="transporter-name"
                placeholder="Enter transporter name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                data-testid="input-transporter-name"
                className={
                  validationErrors.name ? "border-red-500" : ""
                }
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transporter-id" className="text-slate-700">
                <span className="text-red-500">*</span> Transporter ID
              </Label>
              <Input
                id="transporter-id"
                placeholder="Enter transporter ID"
                value={formData.transporterId}
                onChange={(e) =>
                  setFormData({ ...formData, transporterId: e.target.value })
                }
                data-testid="input-transporter-id"
                className={
                  validationErrors.transporterId ? "border-red-500" : ""
                }
              />
              {validationErrors.transporterId && (
                <p className="text-sm text-red-500">
                  {validationErrors.transporterId}
                </p>
              )}
            </div>

            {/* Existing Transporters List */}
            {transporters.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Existing Transporters</h4>
                <div className="space-y-2">
                  {transporters.map((transporter) => (
                    <div
                      key={transporter.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">{transporter.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {transporter.transporterId}
                        </p>
                      </div>
                      <Badge variant="outline">{transporter.id}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: "", transporterId: "" });
                setValidationErrors({});
              }}
              data-testid="button-cancel-transporter"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTransporter}
              disabled={isSaving}
              data-testid="button-save-transporter"
            >
              {isSaving ? "Saving..." : "Save and Select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
