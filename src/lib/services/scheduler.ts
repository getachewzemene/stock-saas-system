import { StockService } from './stock-service';
import { AutomationService } from './automation-service';

export class Scheduler {
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Start all scheduled tasks
   */
  static start() {
    console.log('Starting scheduler...');
    
    // Clear any existing intervals
    this.stop();

    // Update stock statuses every 5 minutes
    const stockStatusInterval = setInterval(async () => {
      await StockService.updateAllStockStatuses();
    }, 5 * 60 * 1000); // 5 minutes

    // Check for expiring batches every hour
    const expiryCheckInterval = setInterval(async () => {
      await StockService.checkExpiringBatches();
    }, 60 * 60 * 1000); // 1 hour

    // Run comprehensive automation every 30 minutes
    const automationInterval = setInterval(async () => {
      await AutomationService.runStockAutomation();
    }, 30 * 60 * 1000); // 30 minutes

    // Auto-resolve expired alerts daily
    const autoResolveInterval = setInterval(async () => {
      await AutomationService.autoResolveExpiredAlerts();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Optimize stock levels weekly
    const optimizationInterval = setInterval(async () => {
      await AutomationService.optimizeStockLevels();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store intervals for cleanup
    this.intervals.push(
      stockStatusInterval,
      expiryCheckInterval,
      automationInterval,
      autoResolveInterval,
      optimizationInterval
    );

    console.log('Scheduler started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  static stop() {
    console.log('Stopping scheduler...');
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });

    this.intervals = [];
    console.log('Scheduler stopped');
  }

  /**
   * Run all tasks immediately (for testing or manual triggers)
   */
  static async runAllTasks() {
    console.log('Running all scheduled tasks...');
    
    try {
      await StockService.updateAllStockStatuses();
      await StockService.checkExpiringBatches();
      await AutomationService.runStockAutomation();
      await AutomationService.autoResolveExpiredAlerts();
      await AutomationService.optimizeStockLevels();
      console.log('All tasks completed successfully');
    } catch (error) {
      console.error('Error running scheduled tasks:', error);
    }
  }

  /**
   * Run specific task
   */
  static async runTask(taskName: string) {
    console.log(`Running task: ${taskName}...`);
    
    try {
      switch (taskName) {
        case 'stockStatus':
          await StockService.updateAllStockStatuses();
          break;
        case 'expiryCheck':
          await StockService.checkExpiringBatches();
          break;
        case 'automation':
          await AutomationService.runStockAutomation();
          break;
        case 'autoResolve':
          await AutomationService.autoResolveExpiredAlerts();
          break;
        case 'optimization':
          await AutomationService.optimizeStockLevels();
          break;
        default:
          console.error(`Unknown task: ${taskName}`);
      }
      console.log(`Task ${taskName} completed successfully`);
    } catch (error) {
      console.error(`Error running task ${taskName}:`, error);
    }
  }
}