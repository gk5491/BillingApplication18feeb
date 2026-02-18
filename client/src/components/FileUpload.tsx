import { Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUpload() {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-4 py-2 shadow-sm mb-3 group-hover:border-blue-300 group-hover:shadow-md transition-all">
        <Upload className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Upload File</span>
        <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />
      </div>
      <p className="text-xs text-slate-500 text-center">
        You can upload a maximum of 10 files, 10MB each
      </p>
    </div>
  );
}
