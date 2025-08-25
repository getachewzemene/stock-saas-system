import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/get-user-from-request';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Get user and enforce access control
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { location: { name: { contains: search, mode: 'insensitive' } } },
        { batch: { batchNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Admins can see all stocks, others only their location
    if (user.role !== 'ADMIN') {
      where.locationId = user.locationId;
    } else if (locationId) {
      where.locationId = locationId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [stockItems, total] = await Promise.all([
      db.stockItem.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
          location: true,
          batch: true,
        },
        skip,
        take: limit,
        orderBy: {
          lastUpdated: 'desc',
        },
      }),
      db.stockItem.count({ where }),
    ]);

    return NextResponse.json({
      stockItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      locationId,
      quantity,
      batchId,
    } = body;

    // Validate required fields
    if (!productId || !locationId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 400 }
      );
    }

    // Check if location exists
    const location = await db.location.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 400 }
      );
    }

    // Check if batch exists (if provided)
    if (batchId) {
      const batch = await db.batch.findUnique({
        where: { id: batchId },
      });
      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 400 }
        );
      }
    }

    // Check if stock item already exists for this combination
    const existingStockItem = await db.stockItem.findUnique({
      where: {
        productId_locationId_batchId: {
          productId,
          locationId,
          batchId: batchId || null,
        },
      },
    });

    let stockItem;
    if (existingStockItem) {
      // Update existing stock item
      const newQuantity = existingStockItem.quantity + parseInt(quantity);
      const newAvailable = newQuantity - existingStockItem.reserved;
      
      stockItem = await db.stockItem.update({
        where: { id: existingStockItem.id },
        data: {
          quantity: newQuantity,
          available: newAvailable,
          status: calculateStockStatus(newQuantity, product.minStock),
          lastUpdated: new Date(),
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          location: true,
          batch: true,
        },
      });

      // Create stock log
      await createStockLog({
        productId,
        locationId,
        batchId,
        quantity: parseInt(quantity),
        type: 'in',
        notes: 'Stock added',
      });
    } else {
      // Create new stock item
      const quantityNum = parseInt(quantity);
      stockItem = await db.stockItem.create({
        data: {
          productId,
          locationId,
          batchId: batchId || null,
          quantity: quantityNum,
          available: quantityNum,
          status: calculateStockStatus(quantityNum, product.minStock),
          lastUpdated: new Date(),
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          location: true,
          batch: true,
        },
      });

      // Create stock log
      await createStockLog({
        productId,
        locationId,
        batchId,
        quantity: quantityNum,
        type: 'in',
        notes: 'Stock created',
      });
    }

    // Check for alerts
    await checkAndCreateAlerts(productId);

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to create stock item' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateStockStatus(quantity: number, minStock: number): string {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity <= minStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}

async function createStockLog(data: {
  productId: string;
  locationId: string;
  batchId?: string;
  quantity: number;
  type: string;
  notes?: string;
}) {
  try {
    await db.stockLog.create({
      data: {
        productId: data.productId,
        locationId: data.locationId,
        batchId: data.batchId,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes,
        userId: 'system', // In real app, get from auth context
      },
    });
  } catch (error) {
    console.error('Error creating stock log:', error);
  }
}

async function checkAndCreateAlerts(productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        stockItems: true,
      },
    });

    if (!product) return;

    const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Check for low stock alert
    if (totalStock <= product.minStock) {
      const existingAlert = await db.alert.findFirst({
        where: {
          productId,
          type: 'LOW_STOCK',
          isActive: true,
          isResolved: false,
        },
      });

      if (!existingAlert) {
        await db.alert.create({
          data: {
            productId,
            type: 'LOW_STOCK',
            message: `Low stock alert: ${product.name} (${totalStock} remaining, min: ${product.minStock})`,
            severity: 'medium',
          },
        });
      }
    }

    // Check for out of stock alert
    if (totalStock === 0) {
      const existingAlert = await db.alert.findFirst({
        where: {
          productId,
          type: 'LOW_STOCK',
          isActive: true,
          isResolved: false,
        },
      });

      if (!existingAlert) {
        await db.alert.create({
          data: {
            productId,
            type: 'LOW_STOCK',
            message: `Out of stock alert: ${product.name} is out of stock`,
            severity: 'high',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking/creating alerts:', error);
  }
}