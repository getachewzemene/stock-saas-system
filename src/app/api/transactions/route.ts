import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get transactions with related data
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          location: {
            select: { id: true, name: true, address: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, price: true }
              },
              batch: {
                select: { id: true, batchNumber: true, expiryDate: true }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      db.transaction.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        totalPages,
        total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerId,
      locationId,
      notes,
      estimatedDeliveryDate,
      items,
      totalAmount,
      discount,
      tax,
      finalAmount,
      status,
      paymentStatus
    } = body;

    // Validate required fields
    if (!type || !locationId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate invoice number
    const prefix = type === 'sale' ? 'INV' : 'ORD';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const invoiceNo = `${prefix}-${timestamp}-${random.toString().padStart(3, '0')}`;

    // Create transaction with items
    const transaction = await db.transaction.create({
      data: {
        invoiceNo,
        type,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerId,
        locationId,
        notes,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        totalAmount,
        discount,
        tax,
        finalAmount,
        status: status || (type === 'sale' ? 'completed' : 'pending'),
        paymentStatus: paymentStatus || 'paid',
        userId: 'user-1', // This would come from auth context
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.price * item.quantity,
            batchId: item.batchId || null
          }))
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        location: {
          select: { id: true, name: true, address: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true }
            },
            batch: {
              select: { id: true, batchNumber: true, expiryDate: true }
            }
          }
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}