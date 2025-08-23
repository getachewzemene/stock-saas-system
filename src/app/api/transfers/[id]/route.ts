import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const transferId = params.id;

    // Check if transfer exists
    const transfer = await db.transfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    let updatedTransfer;

    switch (action) {
      case 'approve':
        if (transfer.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Only pending transfers can be approved' },
            { status: 400 }
          );
        }

        updatedTransfer = await db.transfer.update({
          where: { id: transferId },
          data: {
            status: 'IN_TRANSIT',
          },
          include: {
            fromLocation: true,
            toLocation: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
                batch: true,
              },
            },
          },
        });
        break;

      case 'complete':
        if (transfer.status !== 'IN_TRANSIT') {
          return NextResponse.json(
            { error: 'Only in-transit transfers can be completed' },
            { status: 400 }
          );
        }

        // Update stock levels for transfer completion
        await Promise.all(
          transfer.items.map(async (item) => {
            // Decrease stock from source location
            const fromStock = await db.stockItem.findUnique({
              where: {
                productId_locationId_batchId: {
                  productId: item.productId,
                  locationId: transfer.fromLocationId,
                  batchId: item.batchId || null,
                },
              },
            });

            if (fromStock) {
              await db.stockItem.update({
                where: {
                  productId_locationId_batchId: {
                    productId: item.productId,
                    locationId: transfer.fromLocationId,
                    batchId: item.batchId || null,
                  },
                },
                data: {
                  quantity: {
                    decrement: item.quantity,
                  },
                  available: {
                    decrement: item.quantity,
                  },
                },
              });
            }

            // Increase stock at destination location
            const toStock = await db.stockItem.findUnique({
              where: {
                productId_locationId_batchId: {
                  productId: item.productId,
                  locationId: transfer.toLocationId,
                  batchId: item.batchId || null,
                },
              },
            });

            if (toStock) {
              await db.stockItem.update({
                where: {
                  productId_locationId_batchId: {
                    productId: item.productId,
                    locationId: transfer.toLocationId,
                    batchId: item.batchId || null,
                  },
                },
                data: {
                  quantity: {
                    increment: item.quantity,
                  },
                  available: {
                    increment: item.quantity,
                  },
                },
              });
            } else {
              // Create new stock item if it doesn't exist
              await db.stockItem.create({
                data: {
                  productId: item.productId,
                  locationId: transfer.toLocationId,
                  batchId: item.batchId || null,
                  quantity: item.quantity,
                  available: item.quantity,
                  status: 'IN_STOCK',
                },
              });
            }
          })
        );

        updatedTransfer = await db.transfer.update({
          where: { id: transferId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
          include: {
            fromLocation: true,
            toLocation: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
                batch: true,
              },
            },
          },
        });
        break;

      case 'cancel':
        if (transfer.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'Completed transfers cannot be cancelled' },
            { status: 400 }
          );
        }

        updatedTransfer = await db.transfer.update({
          where: { id: transferId },
          data: {
            status: 'CANCELLED',
          },
          include: {
            fromLocation: true,
            toLocation: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
                batch: true,
              },
            },
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Transform the response to match expected format
    const transformedTransfer = {
      ...updatedTransfer,
      requestedByUser: updatedTransfer.user,
    };

    return NextResponse.json(transformedTransfer);
  } catch (error) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to update transfer' },
      { status: 500 }
    );
  }
}