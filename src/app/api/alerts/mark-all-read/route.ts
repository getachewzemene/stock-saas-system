import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Update all unresolved alerts to inactive (mark as read)
    const result = await db.alert.updateMany({
      where: {
        isActive: true,
        isResolved: false,
      },
      data: {
        isActive: false,
      },
    });

    console.log(`Marked ${result.count} alerts as read`);

    return NextResponse.json({ 
      message: `Marked ${result.count} alerts as read`,
      count: result.count 
    });
  } catch (error) {
    console.error('Error marking alerts as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark alerts as read' },
      { status: 500 }
    );
  }
}