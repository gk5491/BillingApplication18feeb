import React from "react";
import { format } from "date-fns";
import { Mail, AlertCircle, CheckCircle2, Clock, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailLog } from "@shared/schema";

interface EmailLogListProps {
  logs: EmailLog[];
  isLoading?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "queued":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Mail className="h-4 w-4 text-slate-400" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
    case "failed":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
    case "queued":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Queued</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function EmailLogList({ logs, isLoading }: EmailLogListProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-slate-500">Loading communication history...</div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800">
        <Mail className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-slate-500">No communication history found.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="p-4 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(log.status)}
                <span className="font-medium text-slate-900 dark:text-white">{log.subject}</span>
              </div>
              {getStatusBadge(log.status)}
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
              {log.body}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>To: {log.recipient}</span>
                {log.attachments && log.attachments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{log.attachments.length} attachment(s)</span>
                  </div>
                )}
              </div>
              <span>{format(new Date(log.sentAt), "MMM d, yyyy h:mm a")}</span>
            </div>

            {log.errorMessage && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-800/30">
                Error: {log.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
