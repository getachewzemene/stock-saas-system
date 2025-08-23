"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  product: {
    name: string;
    sku?: string;
  };
  quantity: number;
  price: number;
  discount: number;
  total: number;
  batch?: {
    batchNumber: string;
    expiryDate?: string;
  };
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  location: {
    name: string;
    address?: string;
  };
  items: InvoiceItem[];
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function InvoiceTemplate({ invoice, onDownload, onPrint }: InvoiceTemplateProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    
    window.print();
    toast.success("Invoice sent to printer");
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
    // Create a simple text download as fallback
    const invoiceText = `
INVOICE #${invoice.invoiceNo}
============================

Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}

BILL TO:
${invoice.customerName || 'Cash Customer'}
${invoice.customerEmail || ''}
${invoice.customerPhone || ''}
${invoice.customerAddress || ''}

SELLER:
${invoice.user.name}
${invoice.user.email}
${invoice.location.name}
${invoice.location.address || ''}

ITEMS:
${invoice.items.map(item => 
  `${item.product.name} (${item.product.sku || 'N/A'})
  Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
).join('\n')}

SUBTOTAL: $${invoice.totalAmount.toFixed(2)}
DISCOUNT: $${invoice.discount.toFixed(2)}
TAX: $${invoice.tax.toFixed(2)}
TOTAL: $${invoice.finalAmount.toFixed(2)}

Notes: ${invoice.notes || 'N/A'}
    `.trim();

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNo}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success("Invoice downloaded");
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2 text-yellow-600" />
          Download
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2 text-yellow-600" />
          Print
        </Button>
      </div>

      {/* Invoice Content */}
      <div 
        ref={invoiceRef}
        className="border-2 border-gray-300 bg-white shadow-lg"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #f9f9f9 25%, transparent 25%),
            linear-gradient(-45deg, #f9f9f9 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f9f9f9 75%),
            linear-gradient(-45deg, transparent 75%, #f9f9f9 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Header */}
        <div className="border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Invoice #:</strong> {invoice.invoiceNo}</p>
                <p><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                    invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-gray-600">SP</span>
              </div>
              <p className="text-sm text-gray-600">Stock Pro</p>
              <p className="text-xs text-gray-500">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* Bill To and Company Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">BILL TO:</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{invoice.customerName || 'Cash Customer'}</p>
                {invoice.customerEmail && <p className="text-gray-600">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="text-gray-600">{invoice.customerPhone}</p>}
                {invoice.customerAddress && <p className="text-gray-600">{invoice.customerAddress}</p>}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">FROM:</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{invoice.user.name}</p>
                <p className="text-gray-600">{invoice.user.email}</p>
                <p className="text-gray-600">{invoice.location.name}</p>
                {invoice.location.address && <p className="text-gray-600">{invoice.location.address}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ITEMS</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        {item.batch && (
                          <p className="text-xs text-gray-500">Batch: {item.batch.batchNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.product.sku || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-right">${item.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-${invoice.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300 font-bold text-lg">
                  <span>TOTAL:</span>
                  <span>${invoice.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded border">
              <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Thank you for your business! • This is a computer-generated invoice.</p>
            <p className="mt-1">For questions, please contact {invoice.user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}