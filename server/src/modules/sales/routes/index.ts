import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export const salesRouter = Router();

const quotesFilePath = join(process.cwd(), 'server/data/quotes.json');

function readQuotesData() {
  if (!existsSync(quotesFilePath)) {
    return { quotes: [], nextQuoteNumber: 1 };
  }
  const data = readFileSync(quotesFilePath, 'utf-8');
  return JSON.parse(data);
}

function writeQuotesData(data: any) {
  writeFileSync(quotesFilePath, JSON.stringify(data, null, 2));
}

function generateQuoteNumber(num: number): string {
  return `QT-${String(num).padStart(6, '0')}`;
}

salesRouter.get('/quotes', (req, res) => {
  try {
    const data = readQuotesData();
    const quotes = data.quotes.map((quote: any) => ({
      id: quote.id,
      date: quote.date,
      quoteNumber: quote.quoteNumber,
      referenceNumber: quote.referenceNumber,
      customerName: quote.customerName,
      status: quote.status,
      total: quote.total
    }));
    res.json({ success: true, data: quotes });
  } catch (error) {
    console.error('Error reading quotes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotes' });
  }
});

salesRouter.get('/quotes/:id', (req, res) => {
  try {
    const data = readQuotesData();
    const quote = data.quotes.find((q: any) => q.id === req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    console.error('Error reading quote:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quote' });
  }
});

salesRouter.post('/quotes', (req, res) => {
  try {
    const data = readQuotesData();
    const quoteNumber = generateQuoteNumber(data.nextQuoteNumber);
    const now = new Date().toISOString();

    const newQuote = {
      id: String(Date.now()),
      quoteNumber,
      referenceNumber: req.body.referenceNumber || '',
      date: req.body.date || new Date().toISOString().split('T')[0],
      expiryDate: req.body.expiryDate || '',
      customerId: req.body.customerId || '',
      customerName: req.body.customerName || '',
      billingAddress: req.body.billingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
      shippingAddress: req.body.shippingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
      salesperson: req.body.salesperson || '',
      projectName: req.body.projectName || '',
      subject: req.body.subject || '',
      placeOfSupply: req.body.placeOfSupply || '',
      pdfTemplate: req.body.pdfTemplate || 'Standard Template',
      items: req.body.items || [],
      subTotal: req.body.subTotal || 0,
      shippingCharges: req.body.shippingCharges || 0,
      tdsType: req.body.tdsType || '',
      tdsAmount: req.body.tdsAmount || 0,
      cgst: req.body.cgst || 0,
      sgst: req.body.sgst || 0,
      igst: req.body.igst || 0,
      adjustment: req.body.adjustment || 0,
      total: req.body.total || 0,
      customerNotes: req.body.customerNotes ?? 'Looking forward for your business.',
      termsAndConditions: req.body.termsAndConditions || '',
      status: req.body.status || 'Draft',
      emailRecipients: req.body.emailRecipients || [],
      createdAt: now,
      updatedAt: now,
      createdBy: req.body.createdBy || 'Admin User',
      activityLogs: [
        {
          id: '1',
          timestamp: now,
          action: 'created',
          description: `Quote created for ₹${req.body.total?.toLocaleString('en-IN') || '0.00'}`,
          user: req.body.createdBy || 'Admin User'
        }
      ]
    };

    data.quotes.unshift(newQuote);
    data.nextQuoteNumber += 1;
    writeQuotesData(data);

    res.status(201).json({ success: true, data: newQuote });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ success: false, message: 'Failed to create quote' });
  }
});

salesRouter.put('/quotes/:id', (req, res) => {
  try {
    const data = readQuotesData();
    const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

    if (quoteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    const now = new Date().toISOString();
    const existingQuote = data.quotes[quoteIndex];

    const updatedQuote = {
      ...existingQuote,
      ...req.body,
      id: existingQuote.id,
      quoteNumber: existingQuote.quoteNumber,
      createdAt: existingQuote.createdAt,
      updatedAt: now,
      activityLogs: [
        ...existingQuote.activityLogs,
        {
          id: String(existingQuote.activityLogs.length + 1),
          timestamp: now,
          action: 'updated',
          description: 'Quote has been updated',
          user: req.body.updatedBy || 'Admin User'
        }
      ]
    };

    data.quotes[quoteIndex] = updatedQuote;
    writeQuotesData(data);

    res.json({ success: true, data: updatedQuote });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ success: false, message: 'Failed to update quote' });
  }
});

salesRouter.patch('/quotes/:id/status', (req, res) => {
  try {
    const data = readQuotesData();
    const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

    if (quoteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    const now = new Date().toISOString();
    const existingQuote = data.quotes[quoteIndex];
    const newStatus = req.body.status;

    let actionDescription = '';
    switch (newStatus.toLowerCase()) {
      case 'sent':
        actionDescription = 'Quote has been sent';
        break;
      case 'approved':
      case 'accepted':
        actionDescription = 'Quote marked as approved';
        break;
      case 'scrapped':
      case 'declined':
        actionDescription = 'Quote marked as scrapped';
        break;
      default:
        actionDescription = `Quote status changed to ${newStatus}`;
    }

    existingQuote.status = newStatus;
    existingQuote.updatedAt = now;
    existingQuote.activityLogs.push({
      id: String(existingQuote.activityLogs.length + 1),
      timestamp: now,
      action: newStatus.toLowerCase(),
      description: actionDescription,
      user: req.body.updatedBy || 'Admin User'
    });

    data.quotes[quoteIndex] = existingQuote;
    writeQuotesData(data);

    res.json({ success: true, data: existingQuote });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ success: false, message: 'Failed to update quote status' });
  }
});

salesRouter.delete('/quotes/:id', (req, res) => {
  try {
    const data = readQuotesData();
    const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

    if (quoteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    data.quotes.splice(quoteIndex, 1);
    writeQuotesData(data);

    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quote' });
  }
});

salesRouter.get('/quotes/next-number', (req, res) => {
  try {
    const data = readQuotesData();
    const nextNumber = generateQuoteNumber(data.nextQuoteNumber);
    res.json({ success: true, data: { quoteNumber: nextNumber } });
  } catch (error) {
    console.error('Error getting next quote number:', error);
    res.status(500).json({ success: false, message: 'Failed to get next quote number' });
  }
});

salesRouter.get('/invoices', (req, res) => {
  res.json({ success: true, data: [], message: 'Invoices endpoint' });
});

salesRouter.get('/estimates', (req, res) => {
  res.json({ success: true, data: [], message: 'Estimates endpoint' });
});

salesRouter.get('/payments', (req, res) => {
  res.json({ success: true, data: [], message: 'Payments endpoint' });
});

export default salesRouter;
