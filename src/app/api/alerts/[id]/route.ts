import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alert = await db.alert.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { isResolved, isActive, severity } = body;

    // Find the alert
    const alert = await db.alert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert
    const updatedAlert = await db.alert.update({
      where: { id: params.id },
      data: {
        ...(isResolved !== undefined && { 
          isResolved,
          resolvedAt: isResolved ? new Date() : null 
        }),
        ...(isActive !== undefined && { isActive }),
        ...(severity !== undefined && { severity }),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if alert exists
    const alert = await db.alert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Delete alert
    await db.alert.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}