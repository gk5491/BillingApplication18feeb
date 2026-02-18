// Utility functions for logo handling in PDFs and other components

export async function getOrganizationLogo(): Promise<string | null> {
  try {
    const response = await fetch("/api/branding");
    const data = await response.json();
    if (data.success && data.data?.logo?.url) {
      return data.data.logo.url;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch organization logo:", error);
    return null;
  }
}

export async function getOrganizationLogoAsBase64(): Promise<string | null> {
  try {
    const logoUrl = await getOrganizationLogo();
    if (!logoUrl) return null;

    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to fetch logo as base64:", error);
    return null;
  }
}

export interface LogoOptions {
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
}

/**
 * Add organization logo to a jsPDF document
 * @param doc - jsPDF document instance
 * @param options - Logo positioning and sizing options
 */
export async function addLogotoPDF(
  doc: any,
  options: LogoOptions = {}
): Promise<void> {
  try {
    const logoBase64 = await getOrganizationLogoAsBase64();
    if (!logoBase64) return;

    const {
      maxWidth = 40,
      maxHeight = 40,
      x = 14,
      y = 12,
    } = options;

    doc.addImage(logoBase64, "PNG", x, y, maxWidth, maxHeight);
  } catch (error) {
    console.error("Failed to add logo to PDF:", error);
  }
}

export async function getOrganizationSignature(): Promise<string | null> {
  try {
    const response = await fetch("/api/branding");
    const data = await response.json();
    if (data.success && data.data?.signature?.url) {
      return data.data.signature.url;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch organization signature:", error);
    return null;
  }
}

export async function getOrganizationSignatureAsBase64(): Promise<string | null> {
  try {
    const signatureUrl = await getOrganizationSignature();
    if (!signatureUrl) return null;

    const response = await fetch(signatureUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to fetch signature as base64:", error);
    return null;
  }
}

export interface SignatureOptions {
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
}

/**
 * Add organization signature to a jsPDF document
 * @param doc - jsPDF document instance
 * @param options - Signature positioning and sizing options
 */
export async function addSignaturetoPDF(
  doc: any,
  options: SignatureOptions = {}
): Promise<void> {
  try {
    const signatureBase64 = await getOrganizationSignatureAsBase64();
    if (!signatureBase64) return;

    const {
      maxWidth = 40,
      maxHeight = 40,
      x = 14,
      y = 250,
    } = options;

    doc.addImage(signatureBase64, "PNG", x, y, maxWidth, maxHeight);
  } catch (error) {
    console.error("Failed to add signature to PDF:", error);
  }
}
