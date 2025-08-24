import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
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
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sku,
      barcode,
      price,
      cost,
      categoryId,
      minStock,
      maxStock,
      trackBatch,
      trackExpiry,
      isActive,
    } = body;

    // Validate required fields
    if (!name || !price || !cost || !categoryId || minStock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if SKU or barcode already exists
    if (sku) {
      const existingSku = await db.product.findUnique({
        where: { sku },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    if (barcode) {
      const existingBarcode = await db.product.findUnique({
        where: { barcode },
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 400 }
        );
      }
    }

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        sku,
        barcode,
        price: parseFloat(price),
        cost: parseFloat(cost),
        categoryId,
        minStock: parseInt(minStock),
        maxStock: maxStock ? parseInt(maxStock) : null,
        trackBatch: Boolean(trackBatch),
        trackExpiry: Boolean(trackExpiry),
        isActive: Boolean(isActive),
      },
      include: {
        category: true,
        stockItems: {
          include: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}