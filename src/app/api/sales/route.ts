import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                },
              },
              batch: {
                select: {
                  id: true,
                  batchNumber: true,
                  expiryDate: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerId,
      notes,
      locationId,
      items,
      totalAmount,
      discount,
      tax,
      finalAmount,
    } = body;

    // Validate required fields
    if (!locationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create sale with items in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create the sale
      const sale = await prisma.sale.create({
        data: {
          invoiceNo,
          customerName,
          customerId,
          notes,
          totalAmount,
          discount,
          tax,
          finalAmount,
          locationId,
          userId: 'user-1', // This would come from auth context
        },
      });

      // Create sale items and update stock
      const saleItems = await Promise.all(
        items.map(async (item: any) => {
          // Get product details
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              stockItems: {
                where: {
                  locationId,
                  ...(item.batchId && { batchId: item.batchId }),
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          // Check stock availability
          const availableStock = product.stockItems.reduce(
            (total, stockItem) => total + stockItem.available,
            0
          );

          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }

          // Create sale item
          const saleItem = await prisma.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              total: item.price * item.quantity * (1 - (item.discount || 0) / 100),
              batchId: item.batchId,
            },
          });

          // Update stock (FIFO - First In First Out)
          let remainingQuantity = item.quantity;
          for (const stockItem of product.stockItems) {
            if (remainingQuantity <= 0) break;

            const deductQuantity = Math.min(remainingQuantity, stockItem.available);
            
            await prisma.stockItem.update({
              where: { id: stockItem.id },
              data: {
                available: stockItem.available - deductQuantity,
                quantity: stockItem.quantity - deductQuantity,
                lastUpdated: new Date(),
              },
            });

            // Create stock log
            await prisma.stockLog.create({
              data: {
                productId: item.productId,
                locationId,
                batchId: item.batchId,
                quantity: -deductQuantity,
                type: 'out',
                reference: sale.id,
                notes: `Sale: ${invoiceNo}`,
                userId: 'user-1', // This would come from auth context
              },
            });

            remainingQuantity -= deductQuantity;
          }

          return saleItem;
        })
      );

      return { sale, items: saleItems };
    });

    return NextResponse.json(result.sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sale' },
      { status: 500 }
    );
  }
}