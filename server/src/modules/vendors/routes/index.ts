import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const vendorsRouter = Router();

const vendorsFilePath = join(process.cwd(), 'server/data/vendors.json');
const vendorCreditsFilePath = join(process.cwd(), 'server/data/vendorCredits.json');

function readVendorsData() {
  if (!existsSync(vendorsFilePath)) {
    return { vendors: [] };
  }
  const data = readFileSync(vendorsFilePath, 'utf-8');
  return JSON.parse(data);
}

function readVendorCreditsData() {
  if (!existsSync(vendorCreditsFilePath)) {
    return { vendorCredits: [] };
  }
  const data = readFileSync(vendorCreditsFilePath, 'utf-8');
  return JSON.parse(data);
}

vendorsRouter.get('/', (req, res) => {
  try {
    const data = readVendorsData();
    const creditsData = readVendorCreditsData();

    // Calculate unused credits for each vendor
    const vendors = (data.vendors || []).map((vendor: any) => {
      const unusedCredits = (creditsData.vendorCredits || [])
        .filter((vc: any) => String(vc.vendorId) === String(vendor.id) && vc.status === 'OPEN')
        .reduce((sum: number, vc: any) => sum + (Number(vc.balance) || 0), 0);

      return { ...vendor, unusedCredits };
    });

    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendors' });
  }
});

vendorsRouter.get('/:id', (req, res) => {
  try {
    const data = readVendorsData();
    const creditsData = readVendorCreditsData();

    const vendor = data.vendors.find((v: any) => v.id === req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Calculate unused credits for this vendor
    const unusedCredits = (creditsData.vendorCredits || [])
      .filter((vc: any) => String(vc.vendorId) === String(vendor.id) && vc.status === 'OPEN')
      .reduce((sum: number, vc: any) => sum + (Number(vc.balance) || 0), 0);

    res.json({ success: true, data: { ...vendor, unusedCredits } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor' });
  }
});

vendorsRouter.post('/', (req, res) => {
  res.json({ success: true, data: req.body, message: 'Vendor created' });
});

export default vendorsRouter;
