import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MongoErrorPanel() {
  return (
    <div className="bg-[#fff1f0] border border-[#ffccc7] rounded-md overflow-hidden shadow-sm max-w-xl mx-auto font-mono text-sm">
      <div className="bg-[#ff4d4f] text-white px-4 py-2 flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4" />
        <span>Connection Error</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-[#a8071a]">
          connect ECONNREFUSED 127.0.0.1:27017
        </p>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Connection String</label>
          <Input
            value="mongodb://127.0.0.1:27017/Billing_db"
            readOnly
            className="font-mono text-xs bg-white border-slate-300 h-8"
          />
        </div>
      </div>
    </div>
  );
}
