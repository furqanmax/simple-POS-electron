import { IpcMain, BrowserWindow } from 'electron';
import { dbManager } from '../database';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as billSizes from '../../shared/bill-sizes.json';

export function registerPrintHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('print:generatePDF', async (_, orderId: number, options?: {
    outputPath?: string;
    billSize?: string;
    layout?: string;
  }): Promise<string> => {
    const db = dbManager.getDB();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Use stored snapshot if finalized, otherwise generate fresh data
    let invoiceData;
    if (order.status === 'finalized' && order.invoice_snapshot_json) {
      invoiceData = JSON.parse(order.invoice_snapshot_json);
    } else {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
      const customer = order.customer_id 
        ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id)
        : null;
      const template = order.invoice_template_id
        ? db.prepare('SELECT * FROM invoice_templates WHERE id = ?').get(order.invoice_template_id)
        : db.prepare('SELECT * FROM invoice_templates WHERE is_default = 1').get();
      
      invoiceData = { order, items, customer, template };
    }
    
    // Generate PDF path
    const userDataPath = app.getPath('userData');
    const invoicesDir = path.join(userDataPath, 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    
    const pdfPath = options?.outputPath || path.join(invoicesDir, `invoice-${orderId}-${Date.now()}.pdf`);
    
    // Create a hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Get assets for the template
    const templateId = invoiceData.template?.id;
    let assets: any[] = [];
    if (templateId) {
      assets = db.prepare('SELECT * FROM invoice_assets WHERE template_id = ?').all(templateId);
    }
    
    // Load invoice HTML with data
    const billSize = options?.billSize || invoiceData.template?.preferred_bill_size || 'A4';
    const layout = options?.layout || invoiceData.template?.preferred_layout || 'Classic';
    const htmlContent = generateInvoiceHTML(invoiceData, assets, billSize, layout);
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Generate PDF
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      pageSize: invoiceData.template?.preferred_bill_size || 'A4',
      printBackground: true,
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    });
    
    fs.writeFileSync(pdfPath, pdfBuffer);
    pdfWindow.close();
    
    return pdfPath;
  });

  ipcMain.handle('print:printDirect', async (_, orderId: number, printerName?: string): Promise<boolean> => {
    try {
      const db = dbManager.getDB();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Use stored snapshot if finalized
      let invoiceData;
      if (order.status === 'finalized' && order.invoice_snapshot_json) {
        invoiceData = JSON.parse(order.invoice_snapshot_json);
      } else {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
        const customer = order.customer_id 
          ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id)
          : null;
        const template = order.invoice_template_id
          ? db.prepare('SELECT * FROM invoice_templates WHERE id = ?').get(order.invoice_template_id)
          : db.prepare('SELECT * FROM invoice_templates WHERE is_default = 1').get();
        
        invoiceData = { order, items, customer, template };
      }
      
      // Get assets for the template
      const templateId = invoiceData.template?.id;
      let assets: any[] = [];
      if (templateId) {
        assets = db.prepare('SELECT * FROM invoice_assets WHERE template_id = ?').all(templateId);
      }
      
      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      const billSize = invoiceData.template?.preferred_bill_size || 'A4';
      const layout = invoiceData.template?.preferred_layout || 'Classic';
      const htmlContent = generateInvoiceHTML(invoiceData, assets, billSize, layout);
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      // Print
      await printWindow.webContents.print({
        silent: false,
        deviceName: printerName,
        printBackground: true
      });
      
      printWindow.close();
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  });

  ipcMain.handle('print:getPrinters', async (): Promise<Array<{ name: string; isDefault: boolean }>> => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      return [];
    }
    
    try {
      const wc: any = mainWindow.webContents as any;
      const printers = typeof wc.getPrinters === 'function'
        ? wc.getPrinters()
        : (typeof wc.getPrintersAsync === 'function' ? await wc.getPrintersAsync() : []);
      return (printers as any[]).map((p: any) => ({
        name: p.name,
        isDefault: p.isDefault || false
      }));
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  });
}

function generateInvoiceHTML(data: any, assets: any[], billSize: string, layout: string): string {
  const order = data.order;
  const items = data.items || [];
  const customer = data.customer;
  const template = data.template;
  
  const headerData = template?.header_json ? JSON.parse(template.header_json) : {};
  const footerData = template?.footer_json ? JSON.parse(template.footer_json) : {};
  const styles = template?.styles_json ? JSON.parse(template.styles_json) : {};
  
  // Get bill size configuration
  const sizeConfig = (billSizes as any).sizes[billSize] || (billSizes as any).sizes.A4;
  const layoutConfig = (billSizes as any).layouts[layout] || (billSizes as any).layouts.Classic;
  
  // Process assets
  const logo = assets.find(a => a.type === 'logo');
  const qrCodes = assets.filter(a => a.type === 'qr');
  let logoHtml = '';
  let qrCodesHtml = '';
  
  if (logo && layoutConfig.features.includes('logo')) {
    const logoMeta = JSON.parse(logo.meta_json);
    logoHtml = `<img src="data:${logoMeta.mimeType};base64,${logo.blob}" style="max-width: 150px; max-height: 80px;" alt="Logo">`;
  }
  
  if (qrCodes.length > 0 && (layoutConfig.features.includes('qr') || layoutConfig.features.includes('multipleQr'))) {
    qrCodesHtml = `
      <div class="qr-codes" style="display: flex; gap: 10px; justify-content: space-around; margin: 20px 0;">
        ${qrCodes.map(qr => {
          const meta = JSON.parse(qr.meta_json);
          return `
            <div class="qr-code" style="text-align: center;">
              <img src="data:image/png;base64,${qr.blob}" style="width: ${meta.size || 100}px; height: ${meta.size || 100}px;" alt="QR Code">
              <div style="font-size: 10px; margin-top: 5px;">${meta.label || ''}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Generate page-specific CSS
  const pageCSS = generatePageCSS(billSize, sizeConfig);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${pageCSS}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: ${styles.fontFamily || 'Arial, sans-serif'};
          font-size: ${sizeConfig.category === 'thermal' ? 10 : (styles.fontSize || 12)}px;
          padding: ${sizeConfig.category === 'thermal' ? '5px' : '20px'};
          color: #333;
          max-width: ${sizeConfig.category === 'thermal' ? sizeConfig.width + sizeConfig.unit : '100%'};
        }
        .invoice-header { margin-bottom: 30px; }
        .business-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .business-info { font-size: 11px; color: #666; }
        .invoice-meta { margin: 20px 0; display: flex; justify-content: space-between; }
        .customer-info { margin-bottom: 20px; }
        .customer-info h3 { font-size: 14px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; text-align: right; }
        .totals table { width: 300px; margin-left: auto; }
        .grand-total { font-size: 16px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        ${logoHtml}
        <div class="business-name">${headerData.businessName || 'Your Business'}</div>
        <div class="business-info">
          ${headerData.businessAddress || ''}<br>
          ${headerData.businessPhone ? `Phone: ${headerData.businessPhone}` : ''}<br>
          ${headerData.businessEmail ? `Email: ${headerData.businessEmail}` : ''}
        </div>
      </div>
      
      ${qrCodesHtml}
      
      <div class="invoice-meta">
        <div>
          <strong>Invoice #${order.id}</strong><br>
          <span>Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}</span>
        </div>
        <div>
          <strong>Status:</strong> ${order.status}
        </div>
      </div>
      
      ${customer ? `
        <div class="customer-info">
          <h3>Bill To:</h3>
          <div>${customer.name}</div>
          ${customer.phone ? `<div>Phone: ${customer.phone}</div>` : ''}
          ${customer.email ? `<div>Email: ${customer.email}</div>` : ''}
          ${customer.address ? `<div>${customer.address}</div>` : ''}
        </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
              <td class="text-right">₹${item.line_total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${order.subtotal.toFixed(2)}</td>
          </tr>
          ${order.tax_total > 0 ? `
            <tr>
              <td>Tax (${order.tax_rate}%):</td>
              <td class="text-right">₹${order.tax_total.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="grand-total">
            <td><strong>Grand Total:</strong></td>
            <td class="text-right"><strong>₹${order.grand_total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        ${footerData.text || 'Thank you for your business!'}<br>
        <strong>Powered by YourBrand</strong>
      </div>
    </body>
    </html>
  `;
}

function generatePageCSS(billSize: string, sizeConfig: any): string {
  // Generate CSS for specific page size
  let css = `
    @page {
      size: ${sizeConfig.cssPageSize};
      margin: ${sizeConfig.safeMargins.top}${sizeConfig.unit === 'mm' ? 'mm' : 'in'} 
               ${sizeConfig.safeMargins.right}${sizeConfig.unit === 'mm' ? 'mm' : 'in'}
               ${sizeConfig.safeMargins.bottom}${sizeConfig.unit === 'mm' ? 'mm' : 'in'}
               ${sizeConfig.safeMargins.left}${sizeConfig.unit === 'mm' ? 'mm' : 'in'};
    }
  `;
  
  // Thermal-specific CSS
  if (sizeConfig.category === 'thermal') {
    css += `
      body { 
        width: ${sizeConfig.width}${sizeConfig.unit};
        font-size: 9px;
        line-height: 1.2;
      }
      table { font-size: 8px; }
      th, td { padding: 2px 4px; }
      .business-name { font-size: 14px; }
      .business-info { font-size: 8px; }
      .invoice-meta { font-size: 9px; }
      .qr-codes img { max-width: 60px !important; max-height: 60px !important; }
    `;
  }
  
  // Strip format CSS
  if (sizeConfig.category === 'strip') {
    css += `
      body { font-size: 10px; }
      .invoice-header { margin-bottom: 10px; }
      table { margin: 10px 0; }
      .footer { margin-top: 10px; padding-top: 5px; }
    `;
  }
  
  return css;
}
