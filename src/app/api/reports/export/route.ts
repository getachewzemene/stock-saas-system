import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const reportType = searchParams.get('reportType') || 'overview';
    const category = searchParams.get('category') || 'all';
    const format = searchParams.get('format') || 'csv';

    if (!from || !to) {
      return NextResponse.json(
        { error: 'From and to dates are required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (format === 'csv') {
      return generateCSVReport(fromDate, toDate, reportType, category);
    } else if (format === 'pdf') {
      return generatePDFReport(fromDate, toDate, reportType, category);
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or pdf' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

async function generateCSVReport(fromDate: Date, toDate: Date, reportType: string, category: string) {
  try {
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'stock':
        csvContent = await generateStockCSV(fromDate, toDate, category);
        filename = 'stock-report.csv';
        break;
      case 'sales':
        csvContent = await generateSalesCSV(fromDate, toDate, category);
        filename = 'sales-report.csv';
        break;
      case 'lowstock':
        csvContent = await generateLowStockCSV(fromDate, toDate, category);
        filename = 'low-stock-report.csv';
        break;
      default:
        csvContent = await generateOverviewCSV(fromDate, toDate, category);
        filename = 'overview-report.csv';
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error('Failed to generate CSV report');
  }
}

async function generatePDFReport(fromDate: Date, toDate: Date, reportType: string, category: string) {
  try {
    // For PDF generation, we'll return a simple text response for now
    // In a real implementation, you would use a library like jsPDF or puppeteer
    const pdfContent = `PDF Report - ${reportType}
Date Range: ${fromDate.toDateString()} to ${toDate.toDateString()}
Category: ${category}

This is a placeholder for PDF generation.
In a real implementation, this would generate a proper PDF file.`;

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}-report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

async function generateStockCSV(fromDate: Date, toDate: Date, category: string) {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(category !== 'all' && {
        category: {
          name: {
            contains: category,
            mode: 'insensitive',
          },
        },
      }),
    },
    include: {
      category: true,
      stockItems: true,
    },
  });

  const headers = [
    'Product ID',
    'Product Name',
    'SKU',
    'Category',
    'Price',
    'Cost',
    'Total Stock',
    'Stock Value',
    'Min Stock',
    'Status',
  ];

  const rows = products.map(product => {
    const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const stockValue = product.stockItems.reduce((sum, item) => sum + (item.quantity * product.cost), 0);
    const status = totalStock <= product.minStock ? 'Low Stock' : 'In Stock';

    return [
      product.id,
      product.name,
      product.sku || '',
      product.category.name,
      product.price.toString(),
      product.cost.toString(),
      totalStock.toString(),
      stockValue.toFixed(2),
      product.minStock.toString(),
      status,
    ];
  });

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

async function generateSalesCSV(fromDate: Date, toDate: Date, category: string) {
  const sales = await db.sale.findMany({
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
      status: 'completed',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  const headers = [
    'Invoice #',
    'Customer Name',
    'Date',
    'Sales Person',
    'Location',
    'Total Amount',
    'Discount',
    'Tax',
    'Final Amount',
    'Status',
    'Items Count',
  ];

  const rows = sales.map(sale => [
    sale.invoiceNo,
    sale.customerName || 'Walk-in',
    sale.createdAt.toISOString().split('T')[0],
    sale.user.name,
    sale.location.name,
    sale.totalAmount.toFixed(2),
    sale.discount.toFixed(2),
    sale.tax.toFixed(2),
    sale.finalAmount.toFixed(2),
    sale.status,
    sale.items.length.toString(),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

async function generateLowStockCSV(fromDate: Date, toDate: Date, category: string) {
  const lowStockItems = await db.stockItem.findMany({
    where: {
      available: {
        lte: db.product.fields.minStock,
      },
      product: {
        isActive: true,
        ...(category !== 'all' && {
          category: {
            name: {
              contains: category,
              mode: 'insensitive',
            },
          },
        }),
      },
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      location: true,
    },
  });

  const headers = [
    'Product ID',
    'Product Name',
    'SKU',
    'Category',
    'Location',
    'Current Stock',
    'Min Stock',
    'Stock Needed',
    'Price',
    'Stock Value',
  ];

  const rows = lowStockItems.map(item => [
    item.product.id,
    item.product.name,
    item.product.sku || '',
    item.product.category.name,
    item.location.name,
    item.available.toString(),
    item.product.minStock.toString(),
    (item.product.minStock - item.available).toString(),
    item.product.price.toFixed(2),
    (item.available * item.product.cost).toFixed(2),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

async function generateOverviewCSV(fromDate: Date, toDate: Date, category: string) {
  // Generate a comprehensive overview CSV
  const stockCSV = await generateStockCSV(fromDate, toDate, category);
  const salesCSV = await generateSalesCSV(fromDate, toDate, category);
  const lowStockCSV = await generateLowStockCSV(fromDate, toDate, category);

  return `Overview Report - ${fromDate.toDateString()} to ${toDate.toDateString()}
Category: ${category}

=== STOCK LEVELS ===
${stockCSV}

=== SALES DATA ===
${salesCSV}

=== LOW STOCK ITEMS ===
${lowStockCSV}
`;
}