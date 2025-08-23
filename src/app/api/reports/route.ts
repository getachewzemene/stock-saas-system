import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const reportType = searchParams.get('reportType') || 'overview';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'From and to dates are required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Fetch stock levels data with pagination
    const stockLevelsSkip = (page - 1) * limit;
    
    const [stockLevels, stockLevelsTotal] = await Promise.all([
      db.product.findMany({
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
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          stockItems: {
            select: {
              quantity: true,
            },
          },
        },
        skip: stockLevelsSkip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.product.count({
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
      }),
    ]);

    const stockLevelsData = stockLevels.map(product => ({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
      },
      totalStock: product.stockItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: product.stockItems.reduce((sum, item) => sum + (item.quantity * product.cost), 0),
      lowStock: product.stockItems.reduce((sum, item) => sum + item.quantity, 0) <= product.minStock,
    }));

    // Fetch sales data
    const sales = await db.sale.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
        status: 'completed',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group sales by date
    const salesByDate = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          totalSales: 0,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }
      acc[date].totalSales += sale.items.length;
      acc[date].totalRevenue += sale.finalAmount;
      acc[date].transactionCount += 1;
      return acc;
    }, {} as Record<string, { totalSales: number; totalRevenue: number; transactionCount: number }>);

    const salesData = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      totalSales: data.totalSales,
      totalRevenue: data.totalRevenue,
      transactionCount: data.transactionCount,
    }));

    // Fetch low stock items
    const lowStockItems = await db.product.findMany({
      where: {
        isActive: true,
        stockItems: {
          some: {
            available: {
              lte: db.product.fields.minStock,
            },
          },
        },
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
        stockItems: {
          where: {
            available: {
              lte: db.product.fields.minStock,
            },
          },
          include: {
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lowStockItemsData = lowStockItems.flatMap(product => 
      product.stockItems.map(stockItem => ({
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
        },
        currentStock: stockItem.available,
        minStock: product.minStock,
        location: stockItem.location,
      }))
    );

    // Fetch top products
    const productSales = sales.flatMap(sale => sale.items);
    const productSalesMap = new Map<string, { totalSold: number; totalRevenue: number }>();

    productSales.forEach(item => {
      const existing = productSalesMap.get(item.productId) || { totalSold: 0, totalRevenue: 0 };
      productSalesMap.set(item.productId, {
        totalSold: existing.totalSold + item.quantity,
        totalRevenue: existing.totalRevenue + item.total,
      });
    });

    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        product: stockLevels.find(p => p.id === productId)!,
        totalSold: data.totalSold,
        totalRevenue: data.totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Fetch category performance
    const categorySalesMap = new Map<string, { totalRevenue: number; totalSold: number }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const categoryId = item.product.category.id;
        const existing = categorySalesMap.get(categoryId) || { totalRevenue: 0, totalSold: 0 };
        categorySalesMap.set(categoryId, {
          totalRevenue: existing.totalRevenue + item.total,
          totalSold: existing.totalSold + item.quantity,
        });
      });
    });

    const categoryPerformance = Array.from(categorySalesMap.entries())
      .map(([categoryId, data]) => {
        const category = stockLevels.find(p => p.categoryId === categoryId)?.category;
        return {
          category: category || { id: categoryId, name: 'Unknown' },
          totalRevenue: data.totalRevenue,
          totalSold: data.totalSold,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const reportData = {
      stockLevels: stockLevelsData,
      salesData,
      lowStockItems: lowStockItemsData,
      topProducts,
      categoryPerformance,
      pagination: {
        page,
        limit,
        total: stockLevelsTotal,
        pages: Math.ceil(stockLevelsTotal / limit),
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}