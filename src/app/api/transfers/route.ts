import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { transferNo: { contains: search, mode: 'insensitive' } },
        { fromLocation: { name: { contains: search, mode: 'insensitive' } } },
        { toLocation: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      db.transfer.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          fromLocation: true,
          toLocation: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      name: true,
                    },
                  },
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
      }),
      db.transfer.count({ where }),
    ]);

    // Transform the data to match the expected format
    const transformedTransfers = transfers.map(transfer => ({
      ...transfer,
      requestedByUser: transfer.user,
      transferNo: transfer.transferNo || `TRF-${transfer.id.slice(-6).toUpperCase()}`,
    }));

    return NextResponse.json({
      transfers: transformedTransfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromLocationId, toLocationId, notes, items } = body;

    // Validate required fields
    if (!fromLocationId || !toLocationId) {
      return NextResponse.json(
        { error: 'From and To locations are required' },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one transfer item is required' },
        { status: 400 }
      );
    }

    // Generate transfer number
    const transferCount = await db.transfer.count();
    const transferNo = `TRF-${String(transferCount + 1).padStart(6, '0')}`;

    // Create transfer with items
    const transfer = await db.transfer.create({
      data: {
        transferNo,
        fromLocationId,
        toLocationId,
        notes,
        userId: 'user-1', // Default user for demo
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            batchId: item.batchId || null,
            quantity: item.quantity,
            cost: 0, // Will be calculated based on product cost
          })),
        },
      },
      include: {
        fromLocation: true,
        toLocation: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            batch: true,
          },
        },
      },
    });

    // Transform the response to match expected format
    const transformedTransfer = {
      ...transfer,
      requestedByUser: transfer.user,
    };

    return NextResponse.json(transformedTransfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}