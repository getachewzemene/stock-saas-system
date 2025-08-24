import { db } from '@/lib/db';

export class StockService {
  /**
   * Update stock status for all products based on current stock levels
   */
  static async updateAllStockStatuses() {
    try {
      // Get all products with their stock items
      const products = await db.product.findMany({
        include: {
          stockItems: true,
        },
      });

      for (const product of products) {
        await this.updateProductStockStatus(product.id);
      }

      console.log(`Updated stock status for ${products.length} products`);
    } catch (error) {
      console.error('Error updating stock statuses:', error);
    }
  }

  /**
   * Update stock status for a specific product
   */
  static async updateProductStockStatus(productId: string) {
    try {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          stockItems: true,
        },
      });

      if (!product) return;

      const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      const newStatus = this.calculateStockStatus(totalStock, product.minStock);

      // Update all stock items for this product
      await db.stockItem.updateMany({
        where: { productId },
        data: {
          status: newStatus as any,
          lastUpdated: new Date(),
        },
      });

      // Check for alerts
      await this.checkAndCreateAlerts(productId, totalStock, product.minStock);
    } catch (error) {
      console.error(`Error updating stock status for product ${productId}:`, error);
    }
  }

  /**
   * Calculate stock status based on quantity and minimum stock
   */
  static calculateStockStatus(quantity: number, minStock: number): string {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= minStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * Check and create alerts for a product
   */
  static async checkAndCreateAlerts(productId: string, totalStock: number, minStock: number) {
    try {
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) return;

      // Check for low stock alert
      if (totalStock <= minStock && totalStock > 0) {
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
              message: `Low stock alert: ${product.name} (${totalStock} remaining, min: ${minStock})`,
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

  /**
   * Check for expiring batches and create alerts
   */
  static async checkExpiringBatches() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringBatches = await db.batch.findMany({
        where: {
          expiryDate: {
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          product: true,
        },
      });

      for (const batch of expiringBatches) {
        await this.checkAndCreateExpiryAlert(batch.productId, batch.expiryDate!);
      }

      console.log(`Checked ${expiringBatches.length} batches for expiry`);
    } catch (error) {
      console.error('Error checking expiring batches:', error);
    }
  }

  /**
   * Check and create expiry alert for a specific date
   */
  static async checkAndCreateExpiryAlert(productId: string, expiryDate: Date) {
    try {
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
    } catch (error) {
      console.error('Error checking/creating expiry alert:', error);
    }
  }

  /**
   * Process stock log entry and update related data
   */
  static async processStockLog(stockLogData: {
    productId: string;
    locationId: string;
    batchId?: string;
    quantity: number;
    type: string;
    notes?: string;
    userId: string;
  }) {
    try {
      // Create stock log
      await db.stockLog.create({
        data: stockLogData,
      });

      // Update product stock status
      await this.updateProductStockStatus(stockLogData.productId);

      console.log(`Processed stock log for product ${stockLogData.productId}`);
    } catch (error) {
      console.error('Error processing stock log:', error);
    }
  }
}