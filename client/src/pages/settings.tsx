import { useState, useRef } from "react";
import { Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "bmp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { data: branding, isLoading, refetch: refetchBranding } = useBranding();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      if (!SUPPORTED_FORMATS.includes(fileExt)) {
        toast({
          title: "Invalid Format",
          description: `Supported formats: ${SUPPORTED_FORMATS.join(", ").toUpperCase()}`,
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 1 MB",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          const response = await fetch("/api/branding/logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              logoBase64: base64,
              fileName: file.name,
              fileSize: file.size,
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast({
              title: "Success",
              description: "Logo uploaded successfully",
            });
            await refetchBranding();
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to upload logo",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload logo",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process logo",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove the logo? This cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      setIsUploading(true);
      const response = await fetch("/api/branding/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Logo removed successfully",
        });
        await refetchBranding();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      if (!SUPPORTED_FORMATS.includes(fileExt)) {
        toast({
          title: "Invalid Format",
          description: `Supported formats: ${SUPPORTED_FORMATS.join(", ").toUpperCase()}`,
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 1 MB",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          const response = await fetch("/api/branding/signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signatureBase64: base64,
              fileName: file.name,
              fileSize: file.size,
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast({
              title: "Success",
              description: "Signature uploaded successfully",
            });
            await refetchBranding();
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to upload signature",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload signature",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process signature",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove the signature? This cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      setIsUploading(true);
      const response = await fetch("/api/branding/signature", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Signature removed successfully",
        });
        await refetchBranding();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove signature",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove signature",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleIconUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      if (!SUPPORTED_FORMATS.includes(fileExt)) {
        toast({
          title: "Invalid Format",
          description: `Supported formats: ${SUPPORTED_FORMATS.join(", ").toUpperCase()}`,
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 1 MB",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          const response = await fetch("/api/branding/icon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              iconBase64: base64,
              fileName: file.name,
              fileSize: file.size,
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast({
              title: "Success",
              description: "Icon uploaded successfully",
            });
            await refetchBranding();
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to upload icon",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload icon",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process icon",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleRemoveIcon = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove the icon? This cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      setIsUploading(true);
      const response = await fetch("/api/branding/icon", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Icon removed successfully",
        });
        await refetchBranding();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove icon",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove icon",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleSignatureInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleSignatureUpload(e.target.files[0]);
    }
  };

  const handleIconInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleIconUpload(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 mb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-close-settings"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Branding Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
        </div>

        {/* Organizations Link Card */}
        <Card className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setLocation("/settings/organizations")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Manage Organizations
            </CardTitle>
            <Button variant="ghost" size="icon">
              <Upload className="h-4 w-4 rotate-90" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage multiple organizations, switch between them, and configure organization-specific settings.
            </p>
          </CardContent>
        </Card>

        {/* Organization Logo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {branding?.logo?.url ? (
                  <div className="w-40 h-40 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img
                      src={branding.logo.url}
                      alt="Organization Logo"
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-organization-logo"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                    <span className="text-sm text-slate-400">No logo</span>
                  </div>
                )}
              </div>

              {/* Logo Details & Upload */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    This logo will be displayed in transaction PDFs and email
                    notifications.
                  </p>

                  <div className="bg-slate-50 rounded-md p-4 space-y-2 text-sm text-slate-600">
                    <p className="font-medium">Preferred Image Dimensions:</p>
                    <p>240 × 240 pixels @ 72 DPI</p>

                    <p className="font-medium mt-3">Supported Files:</p>
                    <p>JPG, JPEG, PNG, GIF, BMP</p>

                    <p className="font-medium mt-3">Maximum File Size:</p>
                    <p>1 MB</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4" />
                    {branding?.logo ? "Update Logo" : "Upload Logo"}
                  </Button>
                  {branding?.logo && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      disabled={isUploading}
                      className="gap-2"
                      data-testid="button-remove-logo"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>

                {branding?.logo && (
                  <div className="text-xs text-slate-500">
                    <p>Uploaded: {new Date(branding.logo.uploadedAt).toLocaleDateString()}</p>
                    <p>File: {branding.logo.fileName}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Icon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Icon (Sidebar)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {/* Icon Preview */}
              <div className="flex-shrink-0">
                {branding?.icon?.url ? (
                  <div className="w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img
                      src={branding.icon.url}
                      alt="Organization Icon"
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-organization-icon"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                    <span className="text-xs text-slate-400">No icon</span>
                  </div>
                )}
              </div>

              {/* Icon Details & Upload */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    This icon will be displayed in the application sidebar representing your organization.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                    data-testid="button-upload-icon"
                  >
                    <Upload className="h-4 w-4" />
                    {branding?.icon ? "Update Icon" : "Upload Icon"}
                  </Button>
                  {branding?.icon && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveIcon}
                      disabled={isUploading}
                      className="gap-2"
                      data-testid="button-remove-icon"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Signature Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {/* Signature Preview */}
              <div className="flex-shrink-0">
                {branding?.signature?.url ? (
                  <div className="w-40 h-40 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img
                      src={branding.signature.url}
                      alt="Organization Signature"
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-organization-signature"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                    <span className="text-sm text-slate-400">No signature</span>
                  </div>
                )}
              </div>

              {/* Signature Details & Upload */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    This signature will be displayed in transaction PDFs and email
                    notifications.
                  </p>

                  <div className="bg-slate-50 rounded-md p-4 space-y-2 text-sm text-slate-600">
                    <p className="font-medium">Preferred Image Dimensions:</p>
                    <p>240 × 80 pixels @ 72 DPI</p>

                    <p className="font-medium mt-3">Supported Files:</p>
                    <p>JPG, JPEG, PNG, GIF, BMP</p>

                    <p className="font-medium mt-3">Maximum File Size:</p>
                    <p>1 MB</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                    data-testid="button-upload-signature"
                  >
                    <Upload className="h-4 w-4" />
                    {branding?.signature ? "Update Signature" : "Upload Signature"}
                  </Button>
                  {branding?.signature && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveSignature}
                      disabled={isUploading}
                      className="gap-2"
                      data-testid="button-remove-signature"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>

                {branding?.signature && (
                  <div className="text-xs text-slate-500">
                    <p>Uploaded: {new Date(branding.signature.uploadedAt).toLocaleDateString()}</p>
                    <p>File: {branding.signature.fileName}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Theme and color customization coming soon.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="input-file-logo"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(",")}
        onChange={handleSignatureInputChange}
        className="hidden"
        data-testid="input-file-signature"
      />
      <input
        ref={iconInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(",")}
        onChange={handleIconInputChange}
        className="hidden"
        data-testid="input-file-icon"
      />

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-slate-200 p-4 flex items-center gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button
          className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          disabled={isUploading}
          data-testid="button-save-settings"
        >
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          disabled={isUploading}
          data-testid="button-cancel-settings"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
