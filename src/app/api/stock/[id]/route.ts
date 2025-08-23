import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const stockItem = await db.stockItem.findUnique({
      where: { id: params.id },
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

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, quantity, notes } = body;

    // Find the stock item
    const stockItem = await db.stockItem.findUnique({
      where: { id: params.id },
      include: {
        product: true,
      },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    let newQuantity = stockItem.quantity;
    let newAvailable = stockItem.available;
    let logType = 'adjustment';

    // Handle different actions
    switch (action) {
      case 'add':
        newQuantity = stockItem.quantity + parseInt(quantity);
        newAvailable = newQuantity - stockItem.reserved;
        logType = 'in';
        break;
      case 'remove':
        newQuantity = Math.max(0, stockItem.quantity - parseInt(quantity));
        newAvailable = Math.max(0, newQuantity - stockItem.reserved);
        logType = 'out';
        break;
      case 'set':
        newQuantity = parseInt(quantity);
        newAvailable = newQuantity - stockItem.reserved;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update stock item
    const updatedStockItem = await db.stockItem.update({
      where: { id: params.id },
      data: {
        quantity: newQuantity,
        available: newAvailable,
        status: calculateStockStatus(newQuantity, stockItem.product.minStock),
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
      productId: stockItem.productId,
      locationId: stockItem.locationId,
      batchId: stockItem.batchId,
      quantity: Math.abs(parseInt(quantity)),
      type: logType,
      notes: notes || `Stock ${action}: ${quantity}`,
    });

    // Check for alerts
    await checkAndCreateAlerts(stockItem.productId);

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if stock item exists
    const stockItem = await db.stockItem.findUnique({
      where: { id: params.id },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    // Create stock log before deletion
    await createStockLog({
      productId: stockItem.productId,
      locationId: stockItem.locationId,
      batchId: stockItem.batchId,
      quantity: stockItem.quantity,
      type: 'out',
      notes: 'Stock item deleted',
    });

    // Delete stock item
    await db.stockItem.delete({
      where: { id: params.id },
    });

    // Check for alerts
    await checkAndCreateAlerts(stockItem.productId);

    return NextResponse.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
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