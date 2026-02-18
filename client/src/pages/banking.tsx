import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBankAccountSchema, type BankAccount } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Landmark, Link2, ArrowLeft, Pencil, Trash2, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Banking() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading } = useQuery<{ success: boolean; data: BankAccount[] }>({
    queryKey: ["/api/bank-accounts"],
  });

  const accounts = accountsData?.data || [];

  const form = useForm({
    resolver: zodResolver(insertBankAccountSchema),
    defaultValues: {
      accountType: "bank",
      accountName: "",
      accountCode: "",
      currency: "INR",
      accountNumber: "",
      bankName: "",
      ifsc: "",
      description: "",
      isPrimary: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const url = editingAccount ? `/api/bank-accounts/${editingAccount.id}` : "/api/bank-accounts";
      const method = editingAccount ? "PATCH" : "POST";
      const res = await apiRequest(method, url, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Success",
        description: `Bank account ${editingAccount ? "updated" : "added"} successfully`
      });
      setShowForm(false);
      setEditingAccount(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Success", description: "Bank account deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    form.reset({
      accountType: account.accountType as any,
      accountName: account.accountName,
      accountCode: account.accountCode || "",
      currency: account.currency,
      accountNumber: account.accountNumber || "",
      bankName: account.bankName || "",
      ifsc: account.ifsc || "",
      description: account.description || "",
      isPrimary: account.isPrimary,
    });
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => {
            setShowForm(false);
            setEditingAccount(null);
            form.reset();
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingAccount ? "Edit" : "Add"} Bank Account</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-medium">Select Account Type*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bank" />
                            </FormControl>
                            <FormLabel className="font-normal">Bank</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Account Name*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Currency*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ifsc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Max. 500 characters"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make this primary</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAccount(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">Banking</h1>
          <p className="text-muted-foreground">Connect and manage your bank accounts for reconciliation.</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 shadow-lg shadow-primary/20 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" /> Add Bank Account
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bank accounts..." className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-muted" />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account: BankAccount) => (
            <Card key={account.id} className="hover-elevate cursor-pointer group relative" onClick={() => setLocation(`/banking/${account.id}`)}>
              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewingAccount(account)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(account)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this bank account?")) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.accountName}
                </CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{account.currency} 0.00</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {account.bankName || "Manual Account"} • {account.accountNumber ? `****${account.accountNumber.slice(-4)}` : "No account number"}
                </p>
                {account.isPrimary && (
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Primary
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No bank accounts added</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Add your bank accounts manually to reconcile your books.
            </p>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Your First Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewingAccount} onOpenChange={(open) => !open && setViewingAccount(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bank Account Details</DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Account Name</label>
                  <p className="text-sm font-medium">{viewingAccount.accountName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Account Type</label>
                  <p className="text-sm font-medium capitalize">{viewingAccount.accountType.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Currency</label>
                  <p className="text-sm font-medium">{viewingAccount.currency}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Bank Name</label>
                  <p className="text-sm font-medium">{viewingAccount.bankName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Account Number</label>
                  <p className="text-sm font-medium">{viewingAccount.accountNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">IFSC Code</label>
                  <p className="text-sm font-medium">{viewingAccount.ifsc || "N/A"}</p>
                </div>
              </div>
              {viewingAccount.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
                  <p className="text-sm">{viewingAccount.description}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingAccount(null)}>Close</Button>
                <Button onClick={() => {
                  handleEdit(viewingAccount);
                  setViewingAccount(null);
                }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
