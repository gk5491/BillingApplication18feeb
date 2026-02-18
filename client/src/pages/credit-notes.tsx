// import { useState, useEffect } from "react";
// import { useLocation } from "wouter";
// import html2canvas from "html2canvas";
// import { jsPDF } from "jspdf";
// import { useOrganization } from "@/context/OrganizationContext";
// import { SalesPDFHeader } from "@/components/sales-pdf-header";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
//   DropdownMenuSub,
//   DropdownMenuSubTrigger,
//   DropdownMenuPortal,
//   DropdownMenuSubContent,
// } from "@/components/ui/dropdown-menu";
// import {
//   RefreshCw,
//   ArrowUpDown,
//   Plus,
//   Search,
//   Filter,
//   MoreHorizontal,
//   Pencil,
//   Trash2,
//   ChevronDown,
//   X,
//   Send,
//   FileText,
//   Printer,
//   ChevronLeft,
//   ChevronRight,
//   Download,
//   Settings
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { robustIframePrint } from "@/lib/robust-print";
// import { usePagination } from "@/hooks/use-pagination";
// import { TablePagination } from "@/components/table-pagination";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// interface CreditNoteListItem {
//   id: string;
//   date: string;
//   creditNoteNumber: string;
//   referenceNumber: string;
//   customerName: string;
//   invoiceNumber: string;
//   status: string;
//   total: number;
//   creditsRemaining: number;
//   originalInvoiceTotal?: number;
// }

// interface CreditNoteItem {
//   id: string;
//   itemId: string;
//   name: string;
//   description: string;
//   account: string;
//   quantity: number;
//   rate: number;
//   discount: number;
//   discountType: string;
//   tax: number;
//   taxName: string;
//   amount: number;
// }

// interface CreditNoteDetail {
//   id: string;
//   creditNoteNumber: string;
//   referenceNumber: string;
//   date: string;
//   customerId: string;
//   customerName: string;
//   invoiceId: string;
//   invoiceNumber: string;
//   reason: string;
//   salesperson: string;
//   subject: string;
//   billingAddress: {
//     street: string;
//     city: string;
//     state: string;
//     country: string;
//     pincode: string;
//   };
//   gstin: string;
//   placeOfSupply: string;
//   items: CreditNoteItem[];
//   subTotal: number;
//   shippingCharges: number;
//   tdsType: string;
//   tdsAmount: number;
//   cgst: number;
//   sgst: number;
//   igst: number;
//   adjustment: number;
//   total: number;
//   creditsRemaining: number;
//   customerNotes: string;
//   termsAndConditions: string;
//   status: string;
//   pdfTemplate: string;
//   createdAt: string;
//   createdBy: string;
//   originalInvoiceTotal?: number;
// }

// const formatCurrency = (amount: number) => {
//   return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// };

// const formatDate = (dateString: string) => {
//   if (!dateString) return '-';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
// };

// const formatAddress = (address: any) => {
//   if (!address) return ['-'];
//   const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
//   return parts.length > 0 ? parts : ['-'];
// };

// const getStatusBadgeStyles = (status: string) => {
//   const statusLower = status?.toLowerCase() || '';
//   if (statusLower === 'closed' || statusLower === 'applied') {
//     return 'bg-green-100 text-green-700 border-green-200';
//   }
//   if (statusLower === 'open' || statusLower === 'draft') {
//     return 'bg-amber-100 text-amber-700 border-amber-200';
//   }
//   if (statusLower === 'void') {
//     return 'bg-red-100 text-red-700 border-red-200';
//   }
//   return 'bg-slate-100 text-slate-600 border-slate-200';
// };

// function CreditNotePdfPreview({ creditNote, branding, organization }: { creditNote: CreditNoteDetail; branding?: any; organization?: any }) {
//   return (
//     <div id="credit-note-pdf-content" className="bg-white w-full max-w-[210mm] mx-auto" style={{
//       fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//       color: '#0f172a',
//       padding: '40px',
//       margin: '0',
//       minHeight: '316mm',
//       boxSizing: 'border-box',
//       lineHeight: '1.5'
//     }}>
//       {/* Header Section */}
//       <div style={{ marginBottom: '40px' }}>
//         <SalesPDFHeader
//           organization={organization}
//           logo={branding?.logo}
//           documentTitle="CREDIT NOTE"
//           documentNumber={creditNote.creditNoteNumber}
//           date={creditNote.date}
//         />
//       </div>

//       {/* Details Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 md:gap-12 mb-10">
//         <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
//           <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
//             BILL TO
//           </h4>
//           <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
//             {creditNote.customerName}
//           </p>
//           <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
//             {formatAddress(creditNote.billingAddress).map((line, i) => (
//               <p key={i} style={{ margin: '0' }}>{line}</p>
//             ))}
//             {creditNote.gstin && <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1e40af' }}>GSTIN: {creditNote.gstin}</p>}
//           </div>
//         </div>

//         <div>
//           <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
//             CREDIT NOTE DETAILS
//           </h4>
//           <div style={{
//             backgroundColor: '#f8fafc',
//             borderRadius: '8px',
//             padding: '16px',
//             border: '1px solid #f1f5f9'
//           }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
//               <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</span>
//               <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{formatDate(creditNote.date)}</span>
//             </div>
//             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
//               <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reference#</span>
//               <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{creditNote.referenceNumber || '-'}</span>
//             </div>
//             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
//               <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Place of Supply</span>
//               <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{creditNote.placeOfSupply || '-'}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
//               <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
//               <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
//               <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
//               <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
//               <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {creditNote.items.map((item, index) => (
//               <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
//                 <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>{index + 1}</td>
//                 <td style={{ padding: '16px', verticalAlign: 'top' }}>
//                   <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</p>
//                   {item.description && (
//                     <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
//                   )}
//                 </td>
//                 <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
//                 <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.rate)}</td>
//                 <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700' }}>{formatCurrency(item.amount)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Summary Section */}
//       <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 md:gap-12">
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//           {creditNote.customerNotes && (
//             <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
//               <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
//                 Customer Notes
//               </h4>
//               <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{creditNote.customerNotes}</p>
//             </div>
//           )}
//           {creditNote.termsAndConditions && (
//             <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
//               <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
//                 Terms & Conditions
//               </h4>
//               <div style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
//                 {creditNote.termsAndConditions}
//               </div>
//             </div>
//           )}
//         </div>

//         <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9', alignSelf: 'start' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
//             <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
//             <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.subTotal)}</span>
//           </div>
//           {creditNote.cgst > 0 && (
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
//               <span style={{ color: '#64748b', fontWeight: '600' }}>CGST (9.0%)</span>
//               <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.cgst)}</span>
//             </div>
//           )}
//           {creditNote.sgst > 0 && (
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
//               <span style={{ color: '#64748b', fontWeight: '600' }}>SGST (9.0%)</span>
//               <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.sgst)}</span>
//             </div>
//           )}
//           {creditNote.igst > 0 && (
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
//               <span style={{ color: '#64748b', fontWeight: '600' }}>IGST (18.0%)</span>
//               <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.igst)}</span>
//             </div>
//           )}
//           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0', marginBottom: '12px' }}>
//             <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
//             <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>{formatCurrency(creditNote.total)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '4px', border: '1px solid #fde68a' }}>
//             <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Credits Remaining</span>
//             <span style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>{formatCurrency(creditNote.creditsRemaining)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Signature Section */}
//       <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
//         <div>
//           {branding?.signature?.url ? (
//             <img
//               src={branding.signature.url}
//               alt="Signature"
//               style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }}
//             />
//           ) : (
//             <div style={{ height: '80px', width: '200px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}></div>
//           )}
//           <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
//             Authorized Signature
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


// interface CreditNoteDetailPanelProps {
//   creditNote: CreditNoteDetail;
//   branding?: any;
//   organization?: any;
//   onClose: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
// }

// function CreditNoteDetailPanel({ creditNote, branding, organization, onClose, onEdit, onDelete }: CreditNoteDetailPanelProps) {
//   const [showPdfPreview, setShowPdfPreview] = useState(true);
//   const { toast } = useToast();

//   const handlePrint = async () => {
//     toast({ title: "Preparing print...", description: "Please wait while we generate the Credit Note preview." });
//     if (!showPdfPreview) {
//       setShowPdfPreview(true);
//       await new Promise(resolve => setTimeout(resolve, 1500));
//     }
//     try {
//       await robustIframePrint('credit-note-pdf-content', `CreditNote_${creditNote.creditNoteNumber}`);
//     } catch (error) {
//       console.error('Print failed:', error);
//       toast({ title: "Print failed", variant: "destructive" });
//     }
//   };

//   const handleDownloadPDF = async () => {
//     toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
//     const element = document.getElementById("credit-note-pdf-content");
//     if (!element || !creditNote) return;

//     const originalStyle = element.style.cssText;

//     element.style.backgroundColor = "#ffffff";
//     element.style.color = "#0f172a";
//     element.style.width = "800px";
//     element.style.maxWidth = "none";

//     try {
//       const polyfillStyles = document.createElement('style');
//       polyfillStyles.innerHTML = `
//         * {
//           --tw-ring-color: transparent !important;
//           --tw-ring-offset-color: transparent !important;
//           --tw-ring-shadow: none !important;
//           --tw-shadow: none !important;
//           --tw-shadow-colored: none !important;
//           outline-color: transparent !important;
//           caret-color: transparent !important;
//           accent-color: transparent !important;
//         }
//       `;
//       document.head.appendChild(polyfillStyles);

//       const canvas = await html2canvas(element, {
//         scale: 2,
//         useCORS: true,
//         logging: false,
//         backgroundColor: "#ffffff",
//         windowWidth: 800,
//         onclone: (clonedDoc: Document) => {
//           const clonedElement = clonedDoc.getElementById("credit-note-pdf-content");
//           if (clonedElement) {
//             clonedElement.style.width = "800px";
//             clonedElement.style.maxWidth = "none";
//             clonedElement.style.backgroundColor = "#ffffff";
//             clonedElement.style.color = "#000000";

//             const clonedAll = clonedDoc.querySelectorAll("*");
//             clonedAll.forEach((el) => {
//               const htmlEl = el as HTMLElement;

//               const inlineStyle = htmlEl.getAttribute('style') || '';
//               if (inlineStyle.includes('oklch')) {
//                 htmlEl.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, 'inherit'));
//               }

//               const computed = window.getComputedStyle(htmlEl);

//               const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'];
//               colorProps.forEach(prop => {
//                 const value = computed[prop as any];
//                 if (value && value.includes('oklch')) {
//                   if (prop === 'color') htmlEl.style.setProperty('color', '#000000', 'important');
//                   else if (prop === 'backgroundColor') htmlEl.style.setProperty('background-color', '#f3f4f6', 'important');
//                   else if (prop === 'borderColor') htmlEl.style.setProperty('border-color', '#d1d5db', 'important');
//                   else htmlEl.style.setProperty(prop, 'inherit', 'important');
//                 }
//               });

//               htmlEl.style.setProperty("--tw-ring-color", "transparent", "important");
//               htmlEl.style.setProperty("--tw-ring-offset-color", "transparent", "important");
//               htmlEl.style.setProperty("--tw-ring-shadow", "none", "important");
//               htmlEl.style.setProperty("--tw-shadow", "none", "important");
//               htmlEl.style.setProperty("--tw-shadow-colored", "none", "important");
//             });
//           }
//         },
//       });

//       document.head.removeChild(polyfillStyles);

//       const imgData = canvas.toDataURL("image/png", 1.0);
//       const pdf = new jsPDF("p", "mm", "a4");
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//       pdf.addImage(
//         imgData,
//         "PNG",
//         0,
//         0,
//         pdfWidth,
//         pdfHeight,
//         undefined,
//         "FAST",
//       );
//       pdf.save(`CreditNote-${creditNote.creditNoteNumber}.pdf`);

//       const { toast } = await import("@/hooks/use-toast");
//       toast({
//         title: "PDF Downloaded",
//         description: `${creditNote.creditNoteNumber}.pdf has been downloaded successfully.`
//       });
//     } catch (error) {
//       console.error("PDF generation error:", error);
//       const { toast } = await import("@/hooks/use-toast");
//       toast({
//         title: "Failed to download PDF",
//         description: "Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       element.style.cssText = originalStyle;
//     }
//   };


//   return (
//     <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-sm min-h-0">
//       <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
//         <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate" data-testid="text-credit-note-number">
//           {creditNote.creditNoteNumber}
//         </h2>
//         <div className="flex items-center gap-2">
//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" onClick={onEdit}>
//                   <Pencil className="h-4 w-4 text-slate-600" />
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>Edit Credit Note</TooltipContent>
//             </Tooltip>

//             <DropdownMenu>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
//                       <Send className="h-4 w-4 text-slate-600" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                 </TooltipTrigger>
//                 <TooltipContent>Send Credit Note</TooltipContent>
//               </Tooltip>
//               <DropdownMenuContent>
//                 <DropdownMenuItem>Send via Email</DropdownMenuItem>
//                 <DropdownMenuItem>Send via SMS</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <DropdownMenu>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="outline" className="h-9 px-3 gap-2 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-700 font-medium">
//                       <FileText className="h-4 w-4" />
//                       <span>Print / PDF</span>
//                     </Button>
//                   </DropdownMenuTrigger>
//                 </TooltipTrigger>
//                 <TooltipContent>View, Print or Download PDF</TooltipContent>
//               </Tooltip>
//               <DropdownMenuContent>
//                 <DropdownMenuItem onClick={handlePrint}>
//                   <Printer className="mr-2 h-4 w-4" /> Print
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={handleDownloadPDF}>
//                   <FileText className="mr-2 h-4 w-4" /> Download PDF
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <DropdownMenu>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" data-testid="button-more-options">
//                       <MoreHorizontal className="h-4 w-4 text-slate-600" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                 </TooltipTrigger>
//                 <TooltipContent>More Options</TooltipContent>
//               </Tooltip>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem onClick={() => window.location.href = `/e-way-bills/create?creditNoteId=${creditNote.id}`}>
//                   Add e-Way Bill Details
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>Clone</DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
//                   <Trash2 className="mr-2 h-4 w-4" /> Delete
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </TooltipProvider>

//           <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
//           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700" onClick={onClose} data-testid="button-close-panel">
//             <X className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>

//       <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
//         <div className="flex items-center gap-2">
//           <label htmlFor="pdf-view" className="text-xs text-slate-500 font-medium">Show PDF View</label>
//           <Switch
//             id="pdf-view"
//             checked={showPdfPreview}
//             onCheckedChange={setShowPdfPreview}
//             className="scale-75"
//           />
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-100 dark:bg-slate-800/50 pb-32">
//         {showPdfPreview ? (
//           <div className="p-4 sm:p-8 flex justify-center">
//             <div className="bg-white rounded-md shadow-md p-2 w-full max-w-[210mm]">
//               <CreditNotePdfPreview creditNote={creditNote} branding={branding} organization={organization} />
//             </div>
//           </div>
//         ) : (
//           <div className="p-4 space-y-6">
//             <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
//               <div className="flex items-center justify-between mb-4">
//                 <div>
//                   <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Customer</p>
//                   <p className="font-semibold text-blue-600">{creditNote.customerName}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount</p>
//                   <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(creditNote.total)}</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <p className="text-slate-500">Date</p>
//                   <p className="font-medium">{formatDate(creditNote.date)}</p>
//                 </div>
//                 <div>
//                   <p className="text-slate-500">Status</p>
//                   <Badge variant="outline" className={getStatusBadgeStyles(creditNote.status)}>
//                     {creditNote.status}
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
//               <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">More Information</h3>
//               <div className="text-sm text-slate-600 dark:text-slate-400">
//                 <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
//                   <span>Salesperson</span>
//                   <span className="text-blue-600">{creditNote.salesperson || '-'}</span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
//               <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Journal</h3>
//               <p className="text-xs text-slate-500 mb-2">Amount is displayed in your base currency <Badge variant="secondary" className="scale-75">INR</Badge></p>
//               <table className="w-full text-xs">
//                 <thead>
//                   <tr className="border-b border-slate-200 dark:border-slate-700">
//                     <th className="text-left py-2 font-medium text-slate-500">ACCOUNT</th>
//                     <th className="text-right py-2 font-medium text-slate-500">DEBIT</th>
//                     <th className="text-right py-2 font-medium text-slate-500">CREDIT</th>
//                   </tr>
//                 </thead>
//                 {/* ... existing table body ... */}
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function CreditNotes() {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const { currentOrganization } = useOrganization();
//   const [creditNotes, setCreditNotes] = useState<CreditNoteListItem[]>([]);
//   const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNoteDetail | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [creditNoteToDelete, setCreditNoteToDelete] = useState<string | null>(null);
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [branding, setBranding] = useState<any>(null);
//   const [isSearchVisible, setIsSearchVisible] = useState(false);
//   const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'date', order: 'desc' });

//   useEffect(() => {
//     fetchCreditNotes();
//     fetchBranding();
//   }, []);

//   const handleSort = (field: string) => {
//     setSortBy(prev => ({
//       field,
//       order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
//     }));
//   };

//   const handleImport = () => {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.csv,.xlsx,.xls';
//     input.onchange = (e) => {
//       const file = (e.target as HTMLInputElement).files?.[0];
//       if (file) {
//         toast({
//           title: "File Selected",
//           description: `Importing ${file.name}... This feature will be fully implemented soon.`,
//         });
//       }
//     };
//     input.click();
//   };

//   const fetchBranding = async () => {
//     try {
//       const response = await fetch("/api/branding");
//       const data = await response.json();
//       if (data.success) {
//         setBranding(data.data);
//       }
//     } catch (error) {
//       console.error("Failed to fetch branding:", error);
//     }
//   };

//   const fetchCreditNotes = async () => {
//     try {
//       const response = await fetch('/api/credit-notes');
//       const data = await response.json();
//       if (data.success) {
//         setCreditNotes(data.data);
//       }
//     } catch (error) {
//       toast({ title: "Error", description: "Failed to fetch credit notes", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCreditNoteDetail = async (id: string) => {
//     try {
//       const response = await fetch(`/api/credit-notes/${id}`);
//       const data = await response.json();
//       if (data.success) {
//         setSelectedCreditNote(data.data);
//       }
//     } catch (error) {
//       toast({ title: "Error", description: "Failed to fetch credit note details", variant: "destructive" });
//     }
//   };

//   const handleDelete = async () => {
//     if (!creditNoteToDelete) return;
//     try {
//       const response = await fetch(`/api/credit-notes/${creditNoteToDelete}`, { method: 'DELETE' });
//       const data = await response.json();
//       if (data.success) {
//         toast({ title: "Success", description: "Credit note deleted successfully" });
//         fetchCreditNotes();
//         if (selectedCreditNote?.id === creditNoteToDelete) {
//           setSelectedCreditNote(null);
//         }
//       }
//     } catch (error) {
//       toast({ title: "Error", description: "Failed to delete credit note", variant: "destructive" });
//     } finally {
//       setDeleteDialogOpen(false);
//       setCreditNoteToDelete(null);
//     }
//   };

//   const filteredCreditNotes = creditNotes
//     .filter(cn => {
//       const matchesSearch =
//         cn.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         cn.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         cn.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

//       if (activeFilter === "all") return matchesSearch;
//       return matchesSearch && cn.status.toLowerCase() === activeFilter.toLowerCase();
//     })
//     .sort((a, b) => {
//       const field = sortBy.field as keyof CreditNoteListItem;
//       let aValue: any = a[field] ?? '';
//       let bValue: any = b[field] ?? '';

//       if (field === 'date') {
//         aValue = new Date(aValue as string).getTime();
//         bValue = new Date(bValue as string).getTime();
//       }

//       if (aValue < bValue) return sortBy.order === 'asc' ? -1 : 1;
//       if (aValue > bValue) return sortBy.order === 'asc' ? 1 : -1;
//       return 0;
//     });

//   const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredCreditNotes, 10);

//   const toggleSelect = (id: string) => {
//     const newSelected = new Set(selectedIds);
//     if (newSelected.has(id)) {
//       newSelected.delete(id);
//     } else {
//       newSelected.add(id);
//     }
//     setSelectedIds(newSelected);
//   };

//   const toggleSelectAll = () => {
//     if (selectedIds.size === filteredCreditNotes.length) {
//       setSelectedIds(new Set());
//     } else {
//       setSelectedIds(new Set(filteredCreditNotes.map(cn => cn.id)));
//     }
//   };

//   const [isCompact, setIsCompact] = useState(false);

//   useEffect(() => {
//     const checkCompact = () => {
//       setIsCompact(window.innerWidth < 1280);
//     };

//     checkCompact();
//     window.addEventListener('resize', checkCompact);
//     return () => window.removeEventListener('resize', checkCompact);
//   }, []);

//   return (
//     <div className="h-full flex w-full overflow-hidden bg-slate-50">
//       <ResizablePanelGroup key={`${selectedCreditNote ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
//         {(!isCompact || !selectedCreditNote) && (
//           <ResizablePanel
//             defaultSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
//             minSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
//             maxSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
//             className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
//           >
//             <div className="flex flex-col h-full overflow-hidden">
//               <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
//                 <div className="flex items-center gap-4 flex-1 overflow-hidden">
//                   <div className="flex items-center gap-2 flex-shrink-0">
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal">
//                           <span className={selectedCreditNote ? "text-base sm:text-lg lg:text-xl line-clamp-2" : "text-xl line-clamp-2"}>
//                             All Credit Notes
//                           </span>
//                           <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="start" className="w-56">
//                         <DropdownMenuItem onClick={() => setActiveFilter("all")}>All Credit Notes</DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setActiveFilter("open")}>Open</DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setActiveFilter("closed")}>Closed</DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setActiveFilter("void")}>Void</DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                     <span className="text-sm text-slate-400">({creditNotes.length})</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {selectedCreditNote ? (
//                     isSearchVisible ? (
//                       <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//                         <Input
//                           autoFocus
//                           placeholder="Search..."
//                           value={searchQuery}
//                           onChange={(e) => setSearchQuery(e.target.value)}
//                           onBlur={() => !searchQuery && setIsSearchVisible(false)}
//                           className="pl-9 h-9"
//                         />
//                       </div>
//                     ) : (
//                       <Button
//                         variant="outline"
//                         size="icon"
//                         className="h-9 w-9 px-0"
//                         data-testid="button-search-compact"
//                         onClick={() => setIsSearchVisible(true)}
//                       >
//                         <Search className="h-4 w-4 text-slate-500" />
//                       </Button>
//                     )
//                   ) : (
//                     <div className="relative w-[240px] hidden sm:block">
//                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//                       <Input
//                         placeholder="Search credit notes..."
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         className="pl-9 h-9"
//                         data-testid="input-search-credit-notes"
//                       />
//                     </div>
//                   )}

//                   <Button
//                     onClick={() => setLocation('/credit-notes/create')}
//                     className={cn(
//                       "bg-[#002e46] hover:bg-[#001f2f] text-white gap-1.5 h-9 font-semibold",
//                       selectedCreditNote && "w-9 px-0"
//                     )}
//                     size={selectedCreditNote ? "icon" : "default"}
//                     data-testid="button-new-credit-note"
//                   >
//                     <Plus className="h-4 w-4" />
//                     {!selectedCreditNote && <span>New</span>}
//                   </Button>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
//                         <MoreHorizontal className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end" className="w-56 p-1">
//                       <DropdownMenuSub>
//                         <DropdownMenuSubTrigger>
//                           <ArrowUpDown className="mr-2 h-4 w-4" />
//                           <span>Sort by</span>
//                         </DropdownMenuSubTrigger>
//                         <DropdownMenuPortal>
//                           <DropdownMenuSubContent>
//                             <DropdownMenuItem onClick={() => handleSort('date')}>
//                               Date {sortBy.field === 'date' && (sortBy.order === 'asc' ? '↑' : '↓')}
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => handleSort('creditNoteNumber')}>
//                               Credit Note # {sortBy.field === 'creditNoteNumber' && (sortBy.order === 'asc' ? '↑' : '↓')}
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => handleSort('customerName')}>
//                               Customer Name {sortBy.field === 'customerName' && (sortBy.order === 'asc' ? '↑' : '↓')}
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => handleSort('total')}>
//                               Amount {sortBy.field === 'total' && (sortBy.order === 'asc' ? '↑' : '↓')}
//                             </DropdownMenuItem>
//                           </DropdownMenuSubContent>
//                         </DropdownMenuPortal>
//                       </DropdownMenuSub>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem onClick={handleImport} data-testid="menu-import">
//                         <Download className="mr-2 h-4 w-4" /> Import Credit Notes
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={async () => {
//                         const { exportToExcel } = await import("@/lib/export-utils");
//                         toast({ title: "Exporting...", description: "Your file is being prepared." });
//                         const exportData = filteredCreditNotes.map(cn => ({
//                           'Date': formatDate(cn.date),
//                           'Credit Note #': cn.creditNoteNumber,
//                           'Reference Number': cn.referenceNumber || '-',
//                           'Customer Name': cn.customerName,
//                           'Invoice #': cn.invoiceNumber || '-',
//                           'Status': cn.status,
//                           'Amount': cn.total,
//                           'Balance': cn.creditsRemaining
//                         }));
//                         await exportToExcel(exportData, 'credit-notes', 'Credit Notes');
//                       }} data-testid="menu-export">
//                         <Download className="mr-2 h-4 w-4" /> Export Credit Notes
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto scrollbar-hide bg-white" data-testid="container-credit-notes-list">
//                 {isLoading ? (
//                   <div className="px-4 py-8 text-center text-slate-500">Loading...</div>
//                 ) : filteredCreditNotes.length === 0 ? (
//                   <div className="px-4 py-8 text-center text-slate-500">No credit notes found</div>
//                 ) : selectedCreditNote ? (
//                   <div className="flex flex-col divide-y divide-slate-100 bg-white">
//                     {paginatedItems.map((note: any) => (
//                       <div
//                         key={note.id}
//                         className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${selectedCreditNote?.id === note.id ? 'bg-blue-50/50' : ''}`}
//                         onClick={() => fetchCreditNoteDetail(note.id)}
//                       >
//                         <div className="flex items-center justify-between mb-1">
//                           <div className="flex items-center gap-2">
//                             <Checkbox
//                               className="h-4 w-4 rounded border-slate-300"
//                               checked={selectedIds.has(note.id)}
//                               onCheckedChange={(checked) => toggleSelect(note.id)}
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                             <span className="font-medium text-slate-900 text-sm">{note.customerName}</span>
//                           </div>
//                           <span className="font-semibold text-slate-900 text-sm">{formatCurrency(note.total)}</span>
//                         </div>
//                         <div className="flex items-center gap-2 pl-6 text-xs text-slate-500 mb-1">
//                           <span>{note.creditNoteNumber}</span>
//                           <span>•</span>
//                           <span>{formatDate(note.date)}</span>
//                         </div>
//                         <div className="flex items-center gap-2 pl-6">
//                           <span className={`text-[10px] font-bold uppercase tracking-wider ${note.status?.toLowerCase() === 'closed' ? 'text-green-600' : 'text-blue-600'
//                             }`}>{note.status}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <table className="w-full">
//                     <thead className="bg-sidebar-accent/5 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
//                       <tr className="text-left">
//                         <th className="px-4 py-3 w-10">
//                           <Checkbox
//                             checked={selectedIds.size === filteredCreditNotes.length && filteredCreditNotes.length > 0}
//                             onCheckedChange={toggleSelectAll}
//                             data-testid="checkbox-select-all"
//                             className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
//                           />
//                         </th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Date</th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Credit Note#</th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Reference Number</th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Customer Name</th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Invoice#</th>
//                         <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Status</th>
//                         <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">INV TOTAL</th>
//                         <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Amount</th>
//                         <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Balance</th>
//                         <th className="px-4 py-3 w-10"></th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
//                       {paginatedItems.map((note: CreditNoteListItem) => (
//                         <tr
//                           key={note.id}
//                           className={`hover-elevate cursor-pointer ${selectedCreditNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
//                           onClick={() => fetchCreditNoteDetail(note.id)}
//                           data-testid={`row-credit-note-${note.id}`}
//                         >
//                           <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
//                             <Checkbox
//                               checked={selectedIds.has(note.id)}
//                               onCheckedChange={() => toggleSelect(note.id)}
//                               className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
//                             />
//                           </td>
//                           <td className="px-4 py-3 text-sm font-display text-slate-500">{formatDate(note.date)}</td>
//                           <td className="px-4 py-3 text-sm text-sidebar font-semibold font-display">{note.creditNoteNumber}</td>
//                           <td className="px-4 py-3 text-sm font-display text-slate-500">{note.referenceNumber || '-'}</td>
//                           <td className="px-4 py-3 text-sm font-semibold text-sidebar hover:text-primary transition-colors font-display cursor-pointer">{note.customerName}</td>
//                           <td className="px-4 py-3 text-sm font-display text-slate-500">{note.invoiceNumber || '-'}</td>
//                           <td className="px-4 py-3">
//                             <Badge variant="outline" className={cn("font-display font-semibold", getStatusBadgeStyles(note.status))}>
//                               {note.status}
//                             </Badge>
//                           </td>
//                           <td className="px-4 py-3 text-sm text-right font-display text-slate-500">{note.originalInvoiceTotal ? formatCurrency(note.originalInvoiceTotal) : '-'}</td>
//                           <td className="px-4 py-3 text-sm text-right font-semibold text-sidebar font-display">{formatCurrency(note.total)}</td>
//                           <td className="px-4 py-3 text-sm text-right font-semibold text-sidebar font-display">{formatCurrency(note.creditsRemaining)}</td>
//                           <td className="px-4 py-3"></td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>

//               {filteredCreditNotes.length > 0 && (
//                 <div className="border-t bg-white dark:bg-slate-900 flex-shrink-0" data-testid="pagination-wrapper">
//                   <TablePagination
//                     currentPage={currentPage}
//                     totalPages={totalPages}
//                     totalItems={totalItems}
//                     itemsPerPage={itemsPerPage}
//                     onPageChange={goToPage}
//                   />
//                 </div>
//               )}
//             </div>
//           </ResizablePanel>
//         )}

//         {selectedCreditNote && (
//           <>
//             {!isCompact && (
//               <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
//             )}
//             <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white h-full">
//               <div className="h-full flex flex-col overflow-hidden bg-white border-l border-slate-200 dark:border-slate-700 min-h-0">
//                 <CreditNoteDetailPanel
//                   creditNote={selectedCreditNote}
//                   branding={branding}
//                   organization={currentOrganization}
//                   onClose={() => setSelectedCreditNote(null)}
//                   onEdit={() => setLocation(`/credit-notes/${selectedCreditNote.id}/edit`)}
//                   onDelete={() => {
//                     setCreditNoteToDelete(selectedCreditNote.id);
//                     setDeleteDialogOpen(true);
//                   }}
//                 />
//               </div>
//             </ResizablePanel>
//           </>
//         )}
//       </ResizablePanelGroup>

//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Credit Note?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This action cannot be undone. This will permanently delete the credit note.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  ArrowUpDown,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Send,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { robustIframePrint } from "@/lib/robust-print";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditNoteListItem {
  id: string;
  date: string;
  creditNoteNumber: string;
  referenceNumber: string;
  customerName: string;
  invoiceNumber: string;
  status: string;
  total: number;
  creditsRemaining: number;
  originalInvoiceTotal?: number;
}

interface CreditNoteItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: string;
  tax: number;
  taxName: string;
  amount: number;
}

interface CreditNoteDetail {
  id: string;
  creditNoteNumber: string;
  referenceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  reason: string;
  salesperson: string;
  subject: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  gstin: string;
  placeOfSupply: string;
  items: CreditNoteItem[];
  subTotal: number;
  shippingCharges: number;
  tdsType: string;
  tdsAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  creditsRemaining: number;
  customerNotes: string;
  termsAndConditions: string;
  status: string;
  pdfTemplate: string;
  createdAt: string;
  createdBy: string;
  originalInvoiceTotal?: number;
}

const formatCurrency = (amount: number) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatAddress = (address: any) => {
  if (!address) return ['-'];
  const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
  return parts.length > 0 ? parts : ['-'];
};

const getStatusBadgeStyles = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'closed' || statusLower === 'applied') {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (statusLower === 'open' || statusLower === 'draft') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  if (statusLower === 'void') {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

function CreditNotePdfPreview({ creditNote, branding, organization }: { creditNote: CreditNoteDetail; branding?: any; organization?: any }) {
  return (
    <div id="credit-note-pdf-content" className="bg-white w-full max-w-[210mm] mx-auto" style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a',
      padding: '40px',
      margin: '0',
      minHeight: '316mm',
      boxSizing: 'border-box',
      lineHeight: '1.5'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <SalesPDFHeader
          organization={organization}
          logo={branding?.logo}
          documentTitle="CREDIT NOTE"
          documentNumber={creditNote.creditNoteNumber}
          date={creditNote.date}
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 md:gap-12 mb-10">
        <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
            BILL TO
          </h4>
          <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {creditNote.customerName}
          </p>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            {formatAddress(creditNote.billingAddress).map((line, i) => (
              <p key={i} style={{ margin: '0' }}>{line}</p>
            ))}
            {creditNote.gstin && <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1e40af' }}>GSTIN: {creditNote.gstin}</p>}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
            CREDIT NOTE DETAILS
          </h4>
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{formatDate(creditNote.date)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reference#</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{creditNote.referenceNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Place of Supply</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{creditNote.placeOfSupply || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {creditNote.items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>{index + 1}</td>
                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</p>
                  {item.description && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
                  )}
                </td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 md:gap-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {creditNote.customerNotes && (
            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                Customer Notes
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{creditNote.customerNotes}</p>
            </div>
          )}
          {creditNote.termsAndConditions && (
            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                Terms & Conditions
              </h4>
              <div style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {creditNote.termsAndConditions}
              </div>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.subTotal)}</span>
          </div>
          {creditNote.cgst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>CGST (9.0%)</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.cgst)}</span>
            </div>
          )}
          {creditNote.sgst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>SGST (9.0%)</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.sgst)}</span>
            </div>
          )}
          {creditNote.igst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>IGST (18.0%)</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(creditNote.igst)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>{formatCurrency(creditNote.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '4px', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Credits Remaining</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>{formatCurrency(creditNote.creditsRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
        <div>
          {branding?.signature?.url ? (
            <img
              src={branding.signature.url}
              alt="Signature"
              style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }}
            />
          ) : (
            <div style={{ height: '80px', width: '200px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}></div>
          )}
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
            Authorized Signature
          </p>
        </div>
      </div>
    </div>
  );
}


interface CreditNoteDetailPanelProps {
  creditNote: CreditNoteDetail;
  branding?: any;
  organization?: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CreditNoteDetailPanel({ creditNote, branding, organization, onClose, onEdit, onDelete }: CreditNoteDetailPanelProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [amountsToApply, setAmountsToApply] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (showApplyDialog) {
      fetch(`/api/credit-notes/${creditNote.id}/unpaid-invoices`)
        .then(res => res.json())
        .then(data => {
          const invoices = Array.isArray(data) ? data : (data.success ? (data.data || []) : []);
          setUnpaidInvoices(invoices);
        })
        .catch(err => console.error("Failed to fetch unpaid invoices", err));
    }
  }, [showApplyDialog, creditNote.id]);

  const handleApplyCredits = async () => {
    const applications = Object.entries(amountsToApply)
      .filter(([_, amount]) => amount > 0)
      .map(([invoiceId, amount]) => ({ invoiceId, amount }));

    if (applications.length === 0) return;

    try {
      const res = await fetch(`/api/credit-notes/${creditNote.id}/apply-to-invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications })
      });

      if (res.ok) {
        toast({ title: "Credits Applied", description: "Credit has been successfully applied to the selected invoices." });
        setShowApplyDialog(false);
        window.location.reload();
      } else {
        toast({ title: "Failed to apply credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error applying credit", variant: "destructive" });
    }
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we generate the Credit Note preview." });
    if (!showPdfPreview) {
      setShowPdfPreview(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    try {
      await robustIframePrint('credit-note-pdf-content', `CreditNote_${creditNote.creditNoteNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
    const element = document.getElementById("credit-note-pdf-content");
    if (!element || !creditNote) return;

    const originalStyle = element.style.cssText;

    element.style.backgroundColor = "#ffffff";
    element.style.color = "#0f172a";
    element.style.width = "800px";
    element.style.maxWidth = "none";

    try {
      const polyfillStyles = document.createElement('style');
      polyfillStyles.innerHTML = `
        * {
          --tw-ring-color: transparent !important;
          --tw-ring-offset-color: transparent !important;
          --tw-ring-shadow: none !important;
          --tw-shadow: none !important;
          --tw-shadow-colored: none !important;
          outline-color: transparent !important;
          caret-color: transparent !important;
          accent-color: transparent !important;
        }
      `;
      document.head.appendChild(polyfillStyles);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById("credit-note-pdf-content");
          if (clonedElement) {
            clonedElement.style.width = "800px";
            clonedElement.style.maxWidth = "none";
            clonedElement.style.backgroundColor = "#ffffff";
            clonedElement.style.color = "#000000";

            const clonedAll = clonedDoc.querySelectorAll("*");
            clonedAll.forEach((el) => {
              const htmlEl = el as HTMLElement;

              const inlineStyle = htmlEl.getAttribute('style') || '';
              if (inlineStyle.includes('oklch')) {
                htmlEl.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, 'inherit'));
              }

              const computed = window.getComputedStyle(htmlEl);

              const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'];
              colorProps.forEach(prop => {
                const value = computed[prop as any];
                if (value && value.includes('oklch')) {
                  if (prop === 'color') htmlEl.style.setProperty('color', '#000000', 'important');
                  else if (prop === 'backgroundColor') htmlEl.style.setProperty('background-color', '#f3f4f6', 'important');
                  else if (prop === 'borderColor') htmlEl.style.setProperty('border-color', '#d1d5db', 'important');
                  else htmlEl.style.setProperty(prop, 'inherit', 'important');
                }
              });

              htmlEl.style.setProperty("--tw-ring-color", "transparent", "important");
              htmlEl.style.setProperty("--tw-ring-offset-color", "transparent", "important");
              htmlEl.style.setProperty("--tw-ring-shadow", "none", "important");
              htmlEl.style.setProperty("--tw-shadow", "none", "important");
              htmlEl.style.setProperty("--tw-shadow-colored", "none", "important");
            });
          }
        },
      });

      document.head.removeChild(polyfillStyles);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );
      pdf.save(`CreditNote-${creditNote.creditNoteNumber}.pdf`);

      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "PDF Downloaded",
        description: `${creditNote.creditNoteNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Failed to download PDF",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      element.style.cssText = originalStyle;
    }
  };


  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-sm min-h-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate" data-testid="text-credit-note-number">
          {creditNote.creditNoteNumber}
        </h2>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" onClick={onEdit}>
                  <Pencil className="h-4 w-4 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Credit Note</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
                      <Send className="h-4 w-4 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Send Credit Note</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem>Send via Email</DropdownMenuItem>
                <DropdownMenuItem>Send via SMS</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 gap-2 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-700 font-medium">
                      <FileText className="h-4 w-4" />
                      <span>Print / PDF</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>View, Print or Download PDF</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <FileText className="mr-2 h-4 w-4" /> Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="h-9 px-3 gap-2 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-700 font-medium"
              disabled={Number(creditNote.creditsRemaining) <= 0}
              onClick={() => setShowApplyDialog(true)}
            >
              <CreditCard className="h-4 w-4" />
              <span>Apply to Invoices</span>
            </Button>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" data-testid="button-more-options">
                      <MoreHorizontal className="h-4 w-4 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More Options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.location.href = `/e-way-bills/create?creditNoteId=${creditNote.id}`}>
                  Add e-Way Bill Details
                </DropdownMenuItem>
                <DropdownMenuItem>Clone</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700" onClick={onClose} data-testid="button-close-panel">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <label htmlFor="pdf-view" className="text-xs text-slate-500 font-medium">Show PDF View</label>
          <Switch
            id="pdf-view"
            checked={showPdfPreview}
            onCheckedChange={setShowPdfPreview}
            className="scale-75"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-100 dark:bg-slate-800/50 pb-32">
        {showPdfPreview ? (
          <div className="p-4 sm:p-8 flex justify-center">
            <div className="bg-white rounded-md shadow-md p-2 w-full max-w-[210mm]">
              <CreditNotePdfPreview creditNote={creditNote} branding={branding} organization={organization} />
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Customer</p>
                  <p className="font-semibold text-blue-600">{creditNote.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(creditNote.total)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Date</p>
                  <p className="font-medium">{formatDate(creditNote.date)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge variant="outline" className={getStatusBadgeStyles(creditNote.status)}>
                    {creditNote.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">More Information</h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span>Salesperson</span>
                  <span className="text-blue-600">{creditNote.salesperson || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Journal</h3>
              <p className="text-xs text-slate-500 mb-2">Amount is displayed in your base currency <Badge variant="secondary" className="scale-75">INR</Badge></p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 font-medium text-slate-500">ACCOUNT</th>
                    <th className="text-right py-2 font-medium text-slate-500">DEBIT</th>
                    <th className="text-right py-2 font-medium text-slate-500">CREDIT</th>
                  </tr>
                </thead>
                {/* ... existing table body ... */}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Apply to Invoices Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Apply Credits to Invoices</DialogTitle>
            <DialogDescription>
              Select invoices and enter the amount to apply from this credit note. Available credits: {formatCurrency(Number(creditNote.creditsRemaining) || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No unpaid invoices found for this customer.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance Due</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount to Apply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {unpaidInvoices.map((invoice: any) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(invoice.date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(invoice.amount)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(invoice.balanceDue)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn(
                            invoice.status === 'OVERDUE' ? 'border-red-300 text-red-700 bg-red-50' :
                              invoice.status === 'PARTIALLY_PAID' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                'border-blue-300 text-blue-700 bg-blue-50'
                          )}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-slate-500">₹</span>
                            <Input
                              type="number"
                              min="0"
                              max={Math.min(invoice.balanceDue, Number(creditNote.creditsRemaining) || 0)}
                              step="0.01"
                              placeholder="0.00"
                              value={amountsToApply[invoice.id] || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                const maxAmount = Math.min(invoice.balanceDue, Number(creditNote.creditsRemaining) || 0);
                                setAmountsToApply(prev => ({
                                  ...prev,
                                  [invoice.id]: Math.min(value, maxAmount)
                                }));
                              }}
                              className="w-32 text-right h-9"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {unpaidInvoices.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-blue-900">Total Amount to Apply:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(Object.values(amountsToApply).reduce((sum, amt) => sum + (amt || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-blue-700">Remaining Credits After Application:</span>
                  <span className="font-semibold text-blue-900">
                    {formatCurrency(
                      Number(creditNote.creditsRemaining || 0) -
                      Object.values(amountsToApply).reduce((sum, amt) => sum + (amt || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyCredits}
              disabled={Object.values(amountsToApply).reduce((sum, amt) => sum + (amt || 0), 0) === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreditNotes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [creditNotes, setCreditNotes] = useState<CreditNoteListItem[]>([]);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creditNoteToDelete, setCreditNoteToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [branding, setBranding] = useState<any>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'date', order: 'desc' });

  useEffect(() => {
    fetchCreditNotes();
    fetchBranding();
  }, []);

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "File Selected",
          description: `Importing ${file.name}... This feature will be fully implemented soon.`,
        });
      }
    };
    input.click();
  };

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/branding");
      const data = await response.json();
      if (data.success) {
        setBranding(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      const response = await fetch('/api/credit-notes');
      const data = await response.json();
      if (data.success) {
        setCreditNotes(data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch credit notes", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditNoteDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/credit-notes/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedCreditNote(data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch credit note details", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!creditNoteToDelete) return;
    try {
      const response = await fetch(`/api/credit-notes/${creditNoteToDelete}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Credit note deleted successfully" });
        fetchCreditNotes();
        if (selectedCreditNote?.id === creditNoteToDelete) {
          setSelectedCreditNote(null);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete credit note", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCreditNoteToDelete(null);
    }
  };

  const filteredCreditNotes = creditNotes
    .filter(cn => {
      const matchesSearch =
        cn.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cn.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cn.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeFilter === "all") return matchesSearch;
      return matchesSearch && cn.status.toLowerCase() === activeFilter.toLowerCase();
    })
    .sort((a, b) => {
      const field = sortBy.field as keyof CreditNoteListItem;
      let aValue: any = a[field] ?? '';
      let bValue: any = b[field] ?? '';

      if (field === 'date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortBy.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.order === 'asc' ? 1 : -1;
      return 0;
    });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredCreditNotes, 10);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCreditNotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCreditNotes.map(cn => cn.id)));
    }
  };

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };

    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  return (
    <div className="h-full flex w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedCreditNote ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedCreditNote) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
            minSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
            maxSize={isCompact ? 100 : (selectedCreditNote ? 31 : 100)}
            className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal">
                          <span className={selectedCreditNote ? "text-base sm:text-lg lg:text-xl line-clamp-2" : "text-xl line-clamp-2"}>
                            All Credit Notes
                          </span>
                          <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => setActiveFilter("all")}>All Credit Notes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("open")}>Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("closed")}>Closed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("void")}>Void</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-slate-400">({creditNotes.length})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCreditNote ? (
                    isSearchVisible ? (
                      <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          autoFocus
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => !searchQuery && setIsSearchVisible(false)}
                          className="pl-9 h-9"
                        />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 px-0"
                        data-testid="button-search-compact"
                        onClick={() => setIsSearchVisible(true)}
                      >
                        <Search className="h-4 w-4 text-slate-500" />
                      </Button>
                    )
                  ) : (
                    <div className="relative w-[240px] hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search credit notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="input-search-credit-notes"
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => setLocation('/credit-notes/create')}
                    className={cn(
                      "bg-[#002e46] hover:bg-[#001f2f] text-white gap-1.5 h-9 font-semibold",
                      selectedCreditNote && "w-9 px-0"
                    )}
                    size={selectedCreditNote ? "icon" : "default"}
                    data-testid="button-new-credit-note"
                  >
                    <Plus className="h-4 w-4" />
                    {!selectedCreditNote && <span>New</span>}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          <span>Sort by</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleSort('date')}>
                              Date {sortBy.field === 'date' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('creditNoteNumber')}>
                              Credit Note # {sortBy.field === 'creditNoteNumber' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('customerName')}>
                              Customer Name {sortBy.field === 'customerName' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('total')}>
                              Amount {sortBy.field === 'total' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleImport} data-testid="menu-import">
                        <Download className="mr-2 h-4 w-4" /> Import Credit Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        const { exportToExcel } = await import("@/lib/export-utils");
                        toast({ title: "Exporting...", description: "Your file is being prepared." });
                        const exportData = filteredCreditNotes.map(cn => ({
                          'Date': formatDate(cn.date),
                          'Credit Note #': cn.creditNoteNumber,
                          'Reference Number': cn.referenceNumber || '-',
                          'Customer Name': cn.customerName,
                          'Invoice #': cn.invoiceNumber || '-',
                          'Status': cn.status,
                          'Amount': cn.total,
                          'Balance': cn.creditsRemaining
                        }));
                        await exportToExcel(exportData, 'credit-notes', 'Credit Notes');
                      }} data-testid="menu-export">
                        <Download className="mr-2 h-4 w-4" /> Export Credit Notes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide bg-white" data-testid="container-credit-notes-list">
                {isLoading ? (
                  <div className="px-4 py-8 text-center text-slate-500">Loading...</div>
                ) : filteredCreditNotes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">No credit notes found</div>
                ) : selectedCreditNote ? (
                  <div className="flex flex-col divide-y divide-slate-100 bg-white">
                    {paginatedItems.map((note: CreditNoteListItem) => (
                      <div
                        key={note.id}
                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${selectedCreditNote?.id === note.id ? 'bg-blue-50/50' : ''}`}
                        onClick={() => fetchCreditNoteDetail(note.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="h-4 w-4 rounded border-slate-300"
                              checked={selectedIds.has(note.id)}
                              onCheckedChange={(checked) => toggleSelect(note.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="font-medium text-slate-900 text-sm">{note.customerName}</span>
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{formatCurrency(note.total)}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6 text-xs text-slate-500 mb-1">
                          <span>{note.creditNoteNumber}</span>
                          <span>•</span>
                          <span>{formatDate(note.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${note.status?.toLowerCase() === 'closed' ? 'text-green-600' : 'text-blue-600'
                            }`}>{note.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-sidebar-accent/5 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr className="text-left">
                        <th className="px-4 py-3 w-10">
                          <Checkbox
                            checked={selectedIds.size === filteredCreditNotes.length && filteredCreditNotes.length > 0}
                            onCheckedChange={toggleSelectAll}
                            data-testid="checkbox-select-all"
                            className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Date</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Credit Note#</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Reference Number</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Customer Name</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Invoice#</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Status</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">INV TOTAL</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Amount</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Balance</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedItems.map((note: CreditNoteListItem) => (
                        <tr
                          key={note.id}
                          className={`hover-elevate cursor-pointer ${(selectedCreditNote as any)?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => fetchCreditNoteDetail(note.id)}
                          data-testid={`row-credit-note-${note.id}`}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(note.id)}
                              onCheckedChange={() => toggleSelect(note.id)}
                              className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-display text-slate-500">{formatDate(note.date)}</td>
                          <td className="px-4 py-3 text-sm text-sidebar font-semibold font-display">{note.creditNoteNumber}</td>
                          <td className="px-4 py-3 text-sm font-display text-slate-500">{note.referenceNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-sidebar hover:text-primary transition-colors font-display cursor-pointer">{note.customerName}</td>
                          <td className="px-4 py-3 text-sm font-display text-slate-500">{note.invoiceNumber || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("font-display font-semibold", getStatusBadgeStyles(note.status))}>
                              {note.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-display text-slate-500">{note.originalInvoiceTotal ? formatCurrency(note.originalInvoiceTotal) : '-'}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-sidebar font-display">{formatCurrency(note.total)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-sidebar font-display">{formatCurrency(note.creditsRemaining)}</td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {filteredCreditNotes.length > 0 && (
                <div className="border-t bg-white dark:bg-slate-900 flex-shrink-0" data-testid="pagination-wrapper">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>
        )}

        {selectedCreditNote && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white h-full">
              <div className="h-full flex flex-col overflow-hidden bg-white border-l border-slate-200 dark:border-slate-700 min-h-0">
                <CreditNoteDetailPanel
                  creditNote={selectedCreditNote}
                  branding={branding}
                  organization={currentOrganization}
                  onClose={() => setSelectedCreditNote(null)}
                  onEdit={() => setLocation(`/credit-notes/${selectedCreditNote.id}/edit`)}
                  onDelete={() => {
                    setCreditNoteToDelete(selectedCreditNote.id);
                    setDeleteDialogOpen(true);
                  }}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the credit note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


