import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const batch = await db.batch.findUnique({
      where: { id: params.id },
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

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      batchNumber,
      quantity,
      cost,
      expiryDate,
      manufacturingDate,
      notes,
    } = body;

    // Check if batch exists
    const existingBatch = await db.batch.findUnique({
      where: { id: params.id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch number already exists for this product (if changing batch number)
    if (batchNumber && batchNumber !== existingBatch.batchNumber) {
      const duplicateBatch = await db.batch.findFirst({
        where: {
          productId: existingBatch.productId,
          batchNumber,
          id: { not: params.id },
        },
      });

      if (duplicateBatch) {
        return NextResponse.json(
          { error: 'Batch number already exists for this product' },
          { status: 400 }
        );
      }
    }

    // Update batch
    const updatedBatch = await db.batch.update({
      where: { id: params.id },
      data: {
        ...(batchNumber && { batchNumber }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(manufacturingDate !== undefined && { manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null }),
        ...(notes !== undefined && { notes }),
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
      await checkAndCreateExpiryAlert(existingBatch.productId, new Date(expiryDate));
    }

    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if batch exists
    const batch = await db.batch.findUnique({
      where: { id: params.id },
      include: {
        stockItems: true,
        saleItems: true,
        transferItems: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has associated stock items, sales, or transfers
    if (batch.stockItems.length > 0 || batch.saleItems.length > 0 || batch.transferItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete batch with associated stock items, sales, or transfers' },
        { status: 400 }
      );
    }

    // Delete batch
    await db.batch.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
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