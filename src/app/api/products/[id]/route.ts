import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        stockItems: {
          include: {
            location: true,
            batch: true,
          },
        },
        batches: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
    });
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU or barcode already exists (excluding current product)
    if (sku && sku !== existingProduct.sku) {
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

    if (barcode && barcode !== existingProduct.barcode) {
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
    if (categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(price && { price: parseFloat(price) }),
        ...(cost && { cost: parseFloat(cost) }),
        ...(categoryId && { categoryId }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(maxStock !== undefined && { 
          maxStock: maxStock ? parseInt(maxStock) : null 
        }),
        ...(trackBatch !== undefined && { trackBatch: Boolean(trackBatch) }),
        ...(trackExpiry !== undefined && { trackExpiry: Boolean(trackExpiry) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
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

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
      include: {
        stockItems: true,
        saleItems: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has stock or sales
    if (existingProduct.stockItems.length > 0 || existingProduct.saleItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing stock or sales' },
        { status: 400 }
      );
    }

    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}