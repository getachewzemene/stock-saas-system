import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Find the alert
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

    // Update alert as resolved
    const updatedAlert = await db.alert.update({
      where: { id: params.id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        isActive: false,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Log the resolution
    console.log(`Alert ${alert.id} resolved: ${alert.message}`);

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}