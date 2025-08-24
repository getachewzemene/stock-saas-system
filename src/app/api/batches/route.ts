import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const productId = searchParams.get('productId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (productId) {
      where.productId = productId;
    }

    const [batches, total] = await Promise.all([
      db.batch.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
          stockItems: {
            include: {
              location: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.batch.count({ where }),
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      batchNumber,
      productId,
      quantity,
      cost,
      expiryDate,
      manufacturingDate,
      notes,
    } = body;

    // Validate required fields
    if (!batchNumber || !productId || !quantity || !cost) {
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

    // Check if batch number already exists for this product
    const existingBatch = await db.batch.findFirst({
      where: {
        productId,
        batchNumber,
      },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch number already exists for this product' },
        { status: 400 }
      );
    }

    // Create batch
    const batch = await db.batch.create({
      data: {
        batchNumber,
        productId,
        quantity: parseInt(quantity),
        cost: parseFloat(cost),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        notes,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        stockItems: {
          include: {
            location: true,
          },
        },
      },
    });

    // Check for expiry alerts if expiry date is set
    if (expiryDate) {
      await checkAndCreateExpiryAlert(productId, new Date(expiryDate));
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}

// Helper function to check and create expiry alerts
async function checkAndCreateExpiryAlert(productId: string, expiryDate: Date) {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Check if expiry is within 30 days
    if (expiryDate <= thirtyDaysFromNow) {
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) return;

      const existingAlert = await db.alert.findFirst({
        where: {
          productId,
          type: 'EXPIRY',
          isActive: true,
          isResolved: false,
        },
      });

      if (!existingAlert) {
        const severity = expiryDate < new Date() ? 'high' : 'medium';
        const message = expiryDate < new Date() 
          ? `Expired batch alert: ${product.name} has expired on ${expiryDate.toLocaleDateString()}`
          : `Expiry alert: ${product.name} will expire on ${expiryDate.toLocaleDateString()}`;

        await db.alert.create({
          data: {
            productId,
            type: 'EXPIRY',
            message,
            severity,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking/creating expiry alert:', error);
  }
}