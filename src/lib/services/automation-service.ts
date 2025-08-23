import { db } from '@/lib/db';
import { StockService } from './stock-service';

export class AutomationService {
  /**
   * Run comprehensive stock status automation
   */
  static async runStockAutomation() {
    try {
      console.log('Running comprehensive stock automation...');
      
      // Update all stock statuses
      await StockService.updateAllStockStatuses();
      
      // Check for expiring batches
      await StockService.checkExpiringBatches();
      
      // Check for reorder points
      await this.checkReorderPoints();
      
      // Check for stock discrepancies
      await this.checkStockDiscrepancies();
      
      // Generate automated reports
      await this.generateDailyReports();
      
      console.log('Stock automation completed successfully');
    } catch (error) {
      console.error('Error in stock automation:', error);
    }
  }

  /**
   * Check for reorder points and create alerts
   */
  static async checkReorderPoints() {
    try {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          maxStock: { not: null },
        },
        include: {
          stockItems: true,
          alerts: {
            where: {
              type: 'REORDER',
              isActive: true,
              isResolved: false,
            },
          },
        },
      });

      for (const product of products) {
        const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Check if stock is at or below reorder point (50% of max stock)
        if (product.maxStock && totalStock <= product.maxStock * 0.5) {
          const existingAlert = product.alerts.find(alert => alert.type === 'REORDER');
          
          if (!existingAlert) {
            await db.alert.create({
              data: {
                productId: product.id,
                type: 'REORDER',
                message: `Reorder alert: ${product.name} stock is low (${totalStock} remaining, reorder at ${Math.floor(product.maxStock * 0.5)})`,
                severity: totalStock <= product.minStock ? 'high' : 'medium',
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking reorder points:', error);
    }
  }

  /**
   * Check for stock discrepancies and create alerts
   */
  static async checkStockDiscrepancies() {
    try {
      // Check for negative stock
      const negativeStockItems = await db.stockItem.findMany({
        where: {
          OR: [
            { quantity: { lt: 0 } },
            { available: { lt: 0 } },
          ],
        },
        include: {
          product: true,
          location: true,
        },
      });

      for (const stockItem of negativeStockItems) {
        const existingAlert = await db.alert.findFirst({
          where: {
            productId: stockItem.productId,
            type: 'LOW_STOCK',
            message: { contains: 'negative stock' },
            isActive: true,
            isResolved: false,
          },
        });

        if (!existingAlert) {
          await db.alert.create({
            data: {
              productId: stockItem.productId,
              type: 'LOW_STOCK',
              message: `Negative stock alert: ${stockItem.product.name} at ${stockItem.location.name} has negative stock (${stockItem.quantity})`,
              severity: 'high',
            },
          });
        }
      }

      // Check for reserved stock exceeding available stock
      const overReservedItems = await db.stockItem.findMany({
        where: {
          reserved: { gt: db.stockItem.fields.available },
        },
        include: {
          product: true,
          location: true,
        },
      });

      for (const stockItem of overReservedItems) {
        const existingAlert = await db.alert.findFirst({
          where: {
            productId: stockItem.productId,
            type: 'LOW_STOCK',
            message: { contains: 'over-reserved' },
            isActive: true,
            isResolved: false,
          },
        });

        if (!existingAlert) {
          await db.alert.create({
            data: {
              productId: stockItem.productId,
              type: 'LOW_STOCK',
              message: `Over-reserved alert: ${stockItem.product.name} at ${stockItem.location.name} has more reserved stock (${stockItem.reserved}) than available (${stockItem.available})`,
              severity: 'high',
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking stock discrepancies:', error);
    }
  }

  /**
   * Generate daily automated reports
   */
  static async generateDailyReports() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get daily stock movements
      const stockMovements = await db.stockLog.findMany({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          location: true,
        },
      });

      // Group movements by type
      const movementsByType = stockMovements.reduce((acc, movement) => {
        if (!acc[movement.type]) {
          acc[movement.type] = [];
        }
        acc[movement.type].push(movement);
        return acc;
      }, {} as Record<string, typeof stockMovements>);

      // Calculate summary statistics
      const summary = {
        totalMovements: stockMovements.length,
        stockIn: movementsByType['in']?.length || 0,
        stockOut: movementsByType['out']?.length || 0,
        adjustments: movementsByType['adjustment']?.length || 0,
        topProducts: this.getTopProductsFromMovements(stockMovements),
        topLocations: this.getTopLocationsFromMovements(stockMovements),
      };

      // Create daily summary alert for admin review
      const existingSummary = await db.alert.findFirst({
        where: {
          type: 'LOW_STOCK',
          message: { contains: 'Daily stock summary' },
          createdAt: {
            gte: today,
          },
        },
      });

      if (!existingSummary) {
        await db.alert.create({
          data: {
            productId: 'system', // System-generated alert
            type: 'LOW_STOCK',
            message: `Daily stock summary: ${summary.totalMovements} movements (${summary.stockIn} in, ${summary.stockOut} out, ${summary.adjustments} adjustments)`,
            severity: 'low',
          },
        });
      }

      console.log('Daily automated report generated');
    } catch (error) {
      console.error('Error generating daily reports:', error);
    }
  }

  /**
   * Get top products from stock movements
   */
  private static getTopProductsFromMovements(movements: any[]) {
    const productCounts = movements.reduce((acc, movement) => {
      const key = movement.product.id;
      if (!acc[key]) {
        acc[key] = {
          product: movement.product,
          count: 0,
          totalQuantity: 0,
        };
      }
      acc[key].count++;
      acc[key].totalQuantity += movement.quantity;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(productCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get top locations from stock movements
   */
  private static getTopLocationsFromMovements(movements: any[]) {
    const locationCounts = movements.reduce((acc, movement) => {
      const key = movement.location.id;
      if (!acc[key]) {
        acc[key] = {
          location: movement.location,
          count: 0,
          totalQuantity: 0,
        };
      }
      acc[key].count++;
      acc[key].totalQuantity += movement.quantity;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(locationCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Auto-resolve expired alerts
   */
  static async autoResolveExpiredAlerts() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expiredAlerts = await db.alert.findMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isResolved: false,
          isActive: true,
        },
      });

      for (const alert of expiredAlerts) {
        await db.alert.update({
          where: { id: alert.id },
          data: {
            isActive: false,
            isResolved: true,
            resolvedAt: new Date(),
          },
        });
      }

      console.log(`Auto-resolved ${expiredAlerts.length} expired alerts`);
    } catch (error) {
      console.error('Error auto-resolving expired alerts:', error);
    }
  }

  /**
   * Optimize stock levels based on historical data
   */
  static async optimizeStockLevels() {
    try {
      // This is a sophisticated feature that would analyze historical sales data
      // and suggest optimal stock levels for each product
      console.log('Running stock level optimization...');
      
      // For now, we'll implement a basic version that adjusts min stock based on sales velocity
      const products = await db.product.findMany({
        where: {
          isActive: true,
        },
        include: {
          saleItems: {
            where: {
              sale: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
          stockItems: true,
        },
      });

      for (const product of products) {
        const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        const currentStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate daily average sales
        const dailyAverage = totalSold / 30;
        
        // Suggest new min stock based on 7 days of inventory
        const suggestedMinStock = Math.ceil(dailyAverage * 7);
        
        // Only update if significantly different from current min stock
        if (Math.abs(suggestedMinStock - product.minStock) > product.minStock * 0.2) {
          console.log(`Suggested min stock for ${product.name}: ${suggestedMinStock} (current: ${product.minStock})`);
          
          // Create an alert for manual review
          await db.alert.create({
            data: {
              productId: product.id,
              type: 'REORDER',
              message: `Stock optimization suggestion: ${product.name} min stock should be adjusted from ${product.minStock} to ${suggestedMinStock} based on 30-day sales velocity`,
              severity: 'low',
            },
          });
        }
      }

      console.log('Stock level optimization completed');
    } catch (error) {
      console.error('Error in stock level optimization:', error);
    }
  }
}