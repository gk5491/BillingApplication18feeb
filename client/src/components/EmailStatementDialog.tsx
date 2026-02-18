import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link2,
    List,
    ListOrdered,
    Eye,
    X,
    Paperclip,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailStatementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipient: {
        id: string;
        name: string;
        email: string;
    };
    organization: {
        name: string;
        email: string;
    };
    statementPeriod: string;
    pdfData?: string; // base64 encoded PDF
    onSendEmail: (emailData: {
        to: string[];
        cc?: string[];
        bcc?: string[];
        subject: string;
        body: string;
        pdfData?: string;
    }) => Promise<void>;
}

export function EmailStatementDialog({
    open,
    onOpenChange,
    recipient,
    organization,
    statementPeriod,
    pdfData,
    onSendEmail,
}: EmailStatementDialogProps) {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);

    // Form state
    const [to, setTo] = useState(recipient.email);
    const [cc, setCc] = useState("");
    const [bcc, setBcc] = useState("");
    const [subject, setSubject] = useState(
        `Statement of Accounts from ${organization.name}`
    );
    const [body, setBody] = useState(
        `Dear ${recipient.name},\n\nPlease find attached your statement of accounts.\n\nIf you have any questions, please let us know.\n\nRegards,\n${organization.name}`
    );

    // Toolbar state
    const [fontSize, setFontSize] = useState("16px");

    const handleSend = async () => {
        if (!to.trim()) {
            toast({
                title: "Error",
                description: "Please enter a recipient email address",
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);
        try {
            await onSendEmail({
                to: to.split(",").map((e) => e.trim()).filter(Boolean),
                cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
                bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
                subject,
                body,
                pdfData,
            });

            toast({
                title: "Success",
                description: "Statement email sent successfully",
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send email",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    const applyFormatting = (format: string) => {
        // Simple formatting for textarea
        const textarea = document.querySelector('textarea[data-email-body]') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = body.substring(start, end);

        if (!selectedText) {
            toast({
                title: "No text selected",
                description: "Please select some text to format",
                variant: "destructive",
            });
            return;
        }

        let formattedText = selectedText;
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'underline':
                formattedText = `__${selectedText}__`;
                break;
            case 'strikethrough':
                formattedText = `~~${selectedText}~~`;
                break;
        }

        const newBody = body.substring(0, start) + formattedText + body.substring(end);
        setBody(newBody);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Send Email Statement for {recipient.name}</DialogTitle>
                    <DialogDescription>
                        Compose and send an email statement to the recipient.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* From Field */}
                    <div className="space-y-2">
                        <Label htmlFor="from" className="text-xs font-medium text-slate-500">
                            From
                        </Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">
                                {organization.name} &lt;{organization.email}&gt;
                            </span>
                        </div>
                    </div>

                    {/* To Field */}
                    <div className="space-y-2">
                        <Label htmlFor="to" className="text-xs font-medium text-slate-500">
                            Send To
                        </Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md bg-slate-50">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                        {recipient.name} &lt;{to}&gt;
                                        <button
                                            type="button"
                                            onClick={() => setTo("")}
                                            className="hover:text-blue-900"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                    <Input
                                        id="to"
                                        type="email"
                                        value={to === recipient.email ? "" : to}
                                        onChange={(e) => setTo(e.target.value)}
                                        placeholder="Add more recipients"
                                        className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                                    />
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs">
                                Cc
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">
                                Bcc
                            </Button>
                        </div>
                    </div>

                    {/* Subject Field */}
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-medium text-slate-500">
                            Subject
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="font-medium"
                        />
                    </div>

                    {/* Email Body */}
                    <div className="space-y-2">
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-200 bg-slate-50 flex-wrap">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => applyFormatting('bold')}
                                >
                                    <Bold className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => applyFormatting('italic')}
                                >
                                    <Italic className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => applyFormatting('underline')}
                                >
                                    <Underline className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => applyFormatting('strikethrough')}
                                >
                                    <Strikethrough className="h-4 w-4" />
                                </Button>
                                <div className="w-px h-6 bg-slate-300 mx-1" />
                                <select
                                    value={fontSize}
                                    onChange={(e) => setFontSize(e.target.value)}
                                    className="h-8 px-2 text-sm border border-slate-300 rounded bg-white"
                                >
                                    <option value="12px">12px</option>
                                    <option value="14px">14px</option>
                                    <option value="16px">16px</option>
                                    <option value="18px">18px</option>
                                    <option value="20px">20px</option>
                                </select>
                                <div className="w-px h-6 bg-slate-300 mx-1" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <AlignRight className="h-4 w-4" />
                                </Button>
                                <div className="w-px h-6 bg-slate-300 mx-1" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <Link2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <ListOrdered className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Text Area */}
                            <Textarea
                                data-email-body
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="min-h-[250px] border-0 focus-visible:ring-0 resize-none"
                                style={{ fontSize }}
                            />
                        </div>
                    </div>

                    {/* Attachments */}
                    {pdfData && (
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-500">
                                Attachments
                            </Label>
                            <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked
                                        readOnly
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm font-medium">
                                        Attach Statement
                                    </span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-slate-600">
                                        statement_{recipient.name.toLowerCase().replace(/\s+/g, '_')}.pdf
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-slate-500">
                        {pdfData ? "1 attachment" : "No attachments"}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={isSending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
