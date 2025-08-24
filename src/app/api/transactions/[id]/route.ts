import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: params.id },
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

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      paymentStatus,
      notes,
      estimatedDeliveryDate
    } = body;

    const transaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        status,
        paymentStatus,
        notes,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null
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

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete transaction items first
    await db.transactionItem.deleteMany({
      where: { transactionId: params.id }
    });

    // Delete transaction
    await db.transaction.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}