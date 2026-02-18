import { Plus, Search, Filter, FolderOpen, Upload, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Documents() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Store and organize all your business documents in one place.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <p className="font-medium">Invoices</p>
            <p className="text-sm text-muted-foreground">0 files</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <File className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Receipts</p>
            <p className="text-sm text-muted-foreground">0 files</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
            <p className="font-medium">Contracts</p>
            <p className="text-sm text-muted-foreground">0 files</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-3">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">New Folder</p>
            <p className="text-sm text-muted-foreground">Create folder</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Drop files here to upload</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Drag and drop files or click the upload button to add documents.
          </p>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" /> Browse Files
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
