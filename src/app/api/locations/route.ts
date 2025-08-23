import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const locations = await db.location.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            stockItems: true,
            transfersFrom: true,
            transfersTo: true,
            stockLogs: true,
          },
        },
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, address } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    // Check if location already exists
    const existingLocation = await db.location.findUnique({
      where: { name },
    });
    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location already exists' },
        { status: 400 }
      );
    }

    const location = await db.location.create({
      data: {
        name,
        description,
        address,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}