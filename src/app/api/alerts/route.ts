import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const isResolved = searchParams.get('isResolved');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    if (isResolved !== null) {
      where.isResolved = isResolved === 'true';
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.alert.count({ where }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      type,
      message,
      severity,
    } = body;

    // Validate required fields
    if (!productId || !type || !message) {
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

    // Create alert
    const alert = await db.alert.create({
      data: {
        productId,
        type,
        message,
        severity: severity || 'medium',
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}