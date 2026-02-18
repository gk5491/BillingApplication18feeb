import { useState } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Settings, 
  Database, 
  X,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { id: 1, name: "Upload", icon: UploadCloud },
  { id: 2, name: "Configure", icon: Settings },
  { id: 3, name: "Map Fields", icon: Database },
  { id: 4, name: "Preview", icon: FileSpreadsheet },
];

export default function InvoiceImport() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Bulk Invoice Import</h1>
        <p className="text-muted-foreground">Import multiple invoices at once using CSV, TSV, or Excel files. Follow the steps below to map your data correctly.</p>
      </div>

      {/* Progress Stepper */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border/60 -z-10 transform -translate-y-1/2 hidden md:block"></div>
        <div className="flex flex-wrap justify-center md:justify-between items-center max-w-3xl mx-auto gap-4 md:gap-0">
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isCompleted = s.id < step;
            const Icon = s.icon;
            
            return (
              <div key={s.id} className="flex flex-col items-center gap-3 bg-background px-2 min-w-[80px]">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive 
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(63,125,232,0.2)]" 
                    : isCompleted 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-border bg-secondary/30 text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-xs md:text-sm font-medium transition-colors text-center",
                  isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-border/60 shadow-lg overflow-hidden min-h-[400px]">
        <CardContent className="p-0">
          
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="p-6 md:p-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                className={cn(
                  "w-full max-w-xl border-2 border-dashed rounded-2xl p-6 md:p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                  file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"
                )}
                onClick={() => !file && setFile(new File([""], "invoices_jan_2024.csv"))} // Mock file select
              >
                <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-10 w-10 text-primary" />
                </div>
                
                {file ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • CSV File</p>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 mt-2" onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}>
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-foreground">Drag & Drop your file here</h3>
                    <p className="text-muted-foreground">or click to browse (CSV, TSV, XLS)</p>
                    <p className="text-xs text-muted-foreground mt-4 bg-secondary/50 px-3 py-1 rounded-full">Max file size: 10MB</p>
                  </>
                )}
              </div>
              
              <div className="mt-8 flex gap-4 text-sm text-muted-foreground">
                 <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <FileSpreadsheet className="h-4 w-4" /> Download Sample Template
                 </a>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE */}
          {step === 2 && (
             <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label>Character Encoding</Label>
                         <Select defaultValue="utf8">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="utf8">UTF-8 (Recommended)</SelectItem>
                               <SelectItem value="ascii">ASCII</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <Label>Date Format</Label>
                         <Select defaultValue="ymd">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                               <SelectItem value="dmy">DD-MM-YYYY</SelectItem>
                               <SelectItem value="mdy">MM-DD-YYYY</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <Label>File Delimiter</Label>
                         <Select defaultValue="comma">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="comma">Comma (,)</SelectItem>
                               <SelectItem value="semi">Semicolon (;)</SelectItem>
                               <SelectItem value="tab">Tab (\t)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>

                   <div className="space-y-6 bg-secondary/10 p-6 rounded-xl border border-border/50">
                      <h4 className="font-medium text-foreground">Import Preferences</h4>
                      <div className="flex items-center justify-between">
                         <Label htmlFor="auto-gen" className="cursor-pointer">Auto-Generate Invoice Numbers</Label>
                         <Switch id="auto-gen" defaultChecked />
                      </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="link-orders" className="cursor-pointer">Link Related Sales Orders</Label>
                         <Switch id="link-orders" />
                      </div>
                      <div className="flex items-center justify-between">
                         <Label htmlFor="map-addr" className="cursor-pointer">Map Address to Existing Customers</Label>
                         <Switch id="map-addr" defaultChecked />
                      </div>
                       <div className="pt-4 border-t border-border/40">
                         <div className="flex items-center gap-2">
                            <Checkbox id="save-settings" />
                            <Label htmlFor="save-settings" className="text-muted-foreground font-normal">Save these settings for future imports</Label>
                         </div>
                       </div>
                   </div>
                </div>
             </div>
          )}

          {/* STEP 3: MAP FIELDS */}
          {step === 3 && (
            <div className="p-0 animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="bg-secondary/10 border-b border-border/60 p-4 px-8 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span>We matched <strong>8 of 12</strong> columns automatically based on your header row.</span>
               </div>
               <div className="max-h-[500px] overflow-auto">
                  <Table>
                     <TableHeader>
                        <TableRow className="bg-secondary/20">
                           <TableHead className="w-[30%] pl-8">File Header (CSV)</TableHead>
                           <TableHead className="w-[5%] text-center">→</TableHead>
                           <TableHead className="w-[30%]">System Field</TableHead>
                           <TableHead className="w-[35%]">Preview Data (Row 1)</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {[
                           { csv: "Invoice No", sys: "Invoice Number", data: "INV-001" },
                           { csv: "Customer Name", sys: "Customer Name", data: "Acme Corp" },
                           { csv: "Email Address", sys: "Customer Email", data: "billing@acme.com" },
                           { csv: "Issue Date", sys: "Invoice Date", data: "2023-10-24" },
                           { csv: "Due Date", sys: "Due Date", data: "2023-11-24" },
                           { csv: "Item Desc", sys: "Item Name", data: "Web Development" },
                           { csv: "Qty", sys: "Quantity", data: "10" },
                           { csv: "Price", sys: "Rate", data: "150.00" },
                           { csv: "Tax Code", sys: "Unmapped", data: "GST_10", warn: true },
                        ].map((row, i) => (
                           <TableRow key={i} className="hover:bg-secondary/5">
                              <TableHead className="pl-8 font-medium text-foreground">{row.csv}</TableHead>
                              <TableCell className="text-center text-muted-foreground"><ArrowRight className="h-4 w-4 mx-auto" /></TableCell>
                              <TableCell>
                                 <Select defaultValue={row.sys === "Unmapped" ? "" : row.sys.toLowerCase().replace(" ", "_")}>
                                    <SelectTrigger className={cn("h-9", row.warn && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20")}>
                                       <SelectValue placeholder="Select field..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="invoice_number">Invoice Number</SelectItem>
                                       <SelectItem value="customer_name">Customer Name</SelectItem>
                                       <SelectItem value="customer_email">Customer Email</SelectItem>
                                       <SelectItem value="invoice_date">Invoice Date</SelectItem>
                                       <SelectItem value="due_date">Due Date</SelectItem>
                                       <SelectItem value="item_name">Item Name</SelectItem>
                                       <SelectItem value="quantity">Quantity</SelectItem>
                                       <SelectItem value="rate">Rate</SelectItem>
                                       <SelectItem value="ignore">-- Ignore Column --</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm font-mono">{row.data}</TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>
            </div>
          )}

          {/* STEP 4: PREVIEW */}
          {step === 4 && (
             <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="grid grid-cols-3 gap-4 mb-6">
                   <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/30">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                         <span className="text-3xl font-bold text-green-600 dark:text-green-400">24</span>
                         <span className="text-sm text-green-700 dark:text-green-300 font-medium">Ready to Import</span>
                      </CardContent>
                   </Card>
                   <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-800/30">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                         <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">3</span>
                         <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Warnings</span>
                      </CardContent>
                   </Card>
                   <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                         <span className="text-3xl font-bold text-red-600 dark:text-red-400">0</span>
                         <span className="text-sm text-red-700 dark:text-red-300 font-medium">Errors</span>
                      </CardContent>
                   </Card>
                </div>

                <div className="rounded-md border border-border/60 overflow-hidden">
                   <Table>
                      <TableHeader className="bg-secondary/20">
                         <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         <TableRow>
                            <TableCell><Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shadow-none border-green-200">Valid</Badge></TableCell>
                            <TableCell>INV-001</TableCell>
                            <TableCell>Acme Corp</TableCell>
                            <TableCell>Oct 24, 2023</TableCell>
                            <TableCell className="text-right">$1,500.00</TableCell>
                         </TableRow>
                         <TableRow>
                            <TableCell><Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shadow-none border-green-200">Valid</Badge></TableCell>
                            <TableCell>INV-002</TableCell>
                            <TableCell>Globex Inc</TableCell>
                            <TableCell>Oct 25, 2023</TableCell>
                            <TableCell className="text-right">$2,450.00</TableCell>
                         </TableRow>
                         <TableRow>
                            <TableCell><Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Check Tax</Badge></TableCell>
                            <TableCell>INV-003</TableCell>
                            <TableCell>Soylent Corp</TableCell>
                            <TableCell>Oct 26, 2023</TableCell>
                            <TableCell className="text-right">$500.00</TableCell>
                         </TableRow>
                      </TableBody>
                   </Table>
                </div>
             </div>
          )}
        </CardContent>
        
        {/* Footer Actions */}
        <div className="bg-secondary/10 p-6 border-t border-border/60 flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/dashboard">Cancel</a>
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={step === 1 && !file}
              className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            >
              {step === 4 ? "Start Import" : "Next Step"}
              {step !== 4 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
