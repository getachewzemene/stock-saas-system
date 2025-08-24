import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await db.location.findUnique({
      where: { id: params.id },
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

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if location exists
    const existingLocation = await db.location.findUnique({
      where: { id: params.id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if another location with the same name already exists
    const duplicateLocation = await db.location.findFirst({
      where: { 
        name,
        id: { not: params.id }
      },
    });

    if (duplicateLocation) {
      return NextResponse.json(
        { error: 'Location with this name already exists' },
        { status: 400 }
      );
    }

    const location = await db.location.update({
      where: { id: params.id },
      data: {
        name,
        description,
        address,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if location exists
    const existingLocation = await db.location.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            stockItems: true,
            transfersFrom: true,
            transfersTo: true,
          },
        },
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if location has related records
    if (existingLocation._count.stockItems > 0 || 
        existingLocation._count.transfersFrom > 0 || 
        existingLocation._count.transfersTo > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with existing stock items or transfers' },
        { status: 400 }
      );
    }

    await db.location.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}