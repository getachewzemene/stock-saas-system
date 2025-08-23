import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await db.stockItem.deleteMany();
  await db.transferItem.deleteMany();
  await db.saleItem.deleteMany();
  await db.transfer.deleteMany();
  await db.sale.deleteMany();
  await db.batch.deleteMany();
  await db.stockLog.deleteMany();
  await db.alert.deleteMany();
  await db.product.deleteMany();
  await db.location.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
  console.log('✅ Cleanup completed');

  // Create categories
  const categories = await Promise.all([
    db.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      },
    }),
    db.category.create({
      data: {
        name: 'Clothing',
        description: 'Apparel and fashion items',
      },
    }),
    db.category.create({
      data: {
        name: 'Food & Beverages',
        description: 'Food items and drinks',
      },
    }),
    db.category.create({
      data: {
        name: 'Office Supplies',
        description: 'Stationery and office equipment',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // Create locations
  const locations = await Promise.all([
    db.location.create({
      data: {
        name: 'Main Warehouse',
        address: '123 Industrial Ave, City',
      },
    }),
    db.location.create({
      data: {
        name: 'Downtown Store',
        address: '456 Main St, Downtown',
      },
    }),
    db.location.create({
      data: {
        name: 'Mall Branch',
        address: '789 Shopping Center, Mall Area',
      },
    }),
    db.location.create({
      data: {
        name: 'Online Store',
        address: 'Online Warehouse Facility',
      },
    }),
  ]);

  console.log('✅ Locations created');

  // Create products
  const products = await Promise.all([
    db.product.create({
      data: {
        name: 'Laptop Pro 15"',
        description: 'High-performance laptop',
        sku: 'LAP-001',
        price: 1299.99,
        cost: 899.99,
        categoryId: categories[0].id,
        minStock: 5,
        maxStock: 50,
        trackBatch: true,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        sku: 'MOU-001',
        price: 29.99,
        cost: 15.99,
        categoryId: categories[0].id,
        minStock: 20,
        maxStock: 200,
        trackBatch: false,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt',
        sku: 'TSH-001',
        price: 19.99,
        cost: 8.99,
        categoryId: categories[1].id,
        minStock: 50,
        maxStock: 500,
        trackBatch: false,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Coffee Beans Premium',
        description: 'Premium arabica coffee beans',
        sku: 'COF-001',
        price: 24.99,
        cost: 12.99,
        categoryId: categories[2].id,
        minStock: 10,
        maxStock: 100,
        trackBatch: true,
        trackExpiry: true,
      },
    }),
    db.product.create({
      data: {
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        sku: 'CHA-001',
        price: 199.99,
        cost: 120.99,
        categoryId: categories[3].id,
        minStock: 5,
        maxStock: 30,
        trackBatch: false,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Smartphone X',
        description: 'Latest smartphone model',
        sku: 'PHO-001',
        price: 899.99,
        cost: 599.99,
        categoryId: categories[0].id,
        minStock: 10,
        maxStock: 100,
        trackBatch: true,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Jeans Classic',
        description: 'Classic fit jeans',
        sku: 'JEA-001',
        price: 59.99,
        cost: 29.99,
        categoryId: categories[1].id,
        minStock: 30,
        maxStock: 300,
        trackBatch: false,
        trackExpiry: false,
      },
    }),
    db.product.create({
      data: {
        name: 'Green Tea',
        description: 'Organic green tea leaves',
        sku: 'TEA-001',
        price: 14.99,
        cost: 7.99,
        categoryId: categories[2].id,
        minStock: 25,
        maxStock: 250,
        trackBatch: true,
        trackExpiry: true,
      },
    }),
  ]);

  console.log('✅ Products created');

  // Create batches for products that track batches
  const batches = await Promise.all([
    // Laptop batches
    db.batch.create({
      data: {
        batchNumber: 'LAP-B001',
        productId: products[0].id,
        quantity: 25,
        cost: 899.99,
        expiryDate: new Date('2025-12-31'),
      },
    }),
    db.batch.create({
      data: {
        batchNumber: 'LAP-B002',
        productId: products[0].id,
        quantity: 15,
        cost: 899.99,
        expiryDate: new Date('2026-06-30'),
      },
    }),
    // Coffee beans batches
    db.batch.create({
      data: {
        batchNumber: 'COF-B001',
        productId: products[3].id,
        quantity: 50,
        cost: 12.99,
        expiryDate: new Date('2025-09-30'),
      },
    }),
    db.batch.create({
      data: {
        batchNumber: 'COF-B002',
        productId: products[3].id,
        quantity: 30,
        cost: 12.99,
        expiryDate: new Date('2025-11-30'),
      },
    }),
    // Smartphone batches
    db.batch.create({
      data: {
        batchNumber: 'PHO-B001',
        productId: products[5].id,
        quantity: 40,
        cost: 599.99,
        expiryDate: new Date('2026-12-31'),
      },
    }),
    // Green tea batches
    db.batch.create({
      data: {
        batchNumber: 'TEA-B001',
        productId: products[7].id,
        quantity: 60,
        cost: 7.99,
        expiryDate: new Date('2025-08-31'),
      },
    }),
  ]);

  console.log('✅ Batches created');

  // Create stock items
  const stockItems = await Promise.all([
    // Main Warehouse stock
    db.stockItem.create({
      data: {
        productId: products[0].id,
        locationId: locations[0].id,
        batchId: batches[0].id,
        quantity: 20,
        available: 20,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[1].id,
        locationId: locations[0].id,
        quantity: 150,
        available: 150,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[2].id,
        locationId: locations[0].id,
        quantity: 300,
        available: 300,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[3].id,
        locationId: locations[0].id,
        batchId: batches[2].id,
        quantity: 40,
        available: 40,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[4].id,
        locationId: locations[0].id,
        quantity: 15,
        available: 15,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[5].id,
        locationId: locations[0].id,
        batchId: batches[4].id,
        quantity: 30,
        available: 30,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[6].id,
        locationId: locations[0].id,
        quantity: 200,
        available: 200,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[7].id,
        locationId: locations[0].id,
        batchId: batches[5].id,
        quantity: 45,
        available: 45,
        status: 'IN_STOCK',
      },
    }),

    // Downtown Store stock
    db.stockItem.create({
      data: {
        productId: products[0].id,
        locationId: locations[1].id,
        batchId: batches[1].id,
        quantity: 8,
        available: 8,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[1].id,
        locationId: locations[1].id,
        quantity: 80,
        available: 80,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[2].id,
        locationId: locations[1].id,
        quantity: 150,
        available: 150,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[5].id,
        locationId: locations[1].id,
        batchId: batches[4].id,
        quantity: 25,
        available: 25,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[6].id,
        locationId: locations[1].id,
        quantity: 100,
        available: 100,
        status: 'IN_STOCK',
      },
    }),

    // Mall Branch stock
    db.stockItem.create({
      data: {
        productId: products[1].id,
        locationId: locations[2].id,
        quantity: 60,
        available: 60,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[2].id,
        locationId: locations[2].id,
        quantity: 200,
        available: 200,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[3].id,
        locationId: locations[2].id,
        batchId: batches[3].id,
        quantity: 15,
        available: 15,
        status: 'LOW_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[5].id,
        locationId: locations[2].id,
        batchId: batches[4].id,
        quantity: 12,
        available: 12,
        status: 'IN_STOCK',
      },
    }),

    // Online Store stock
    db.stockItem.create({
      data: {
        productId: products[0].id,
        locationId: locations[3].id,
        batchId: batches[0].id,
        quantity: 3,
        available: 3,
        status: 'LOW_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[1].id,
        locationId: locations[3].id,
        quantity: 40,
        available: 40,
        status: 'IN_STOCK',
      },
    }),
    db.stockItem.create({
      data: {
        productId: products[5].id,
        locationId: locations[3].id,
        batchId: batches[4].id,
        quantity: 8,
        available: 8,
        status: 'LOW_STOCK',
      },
    }),
  ]);

  console.log('✅ Stock items created');

  // Create demo users
  const users = await Promise.all([
    db.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    }),
    db.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
      },
    }),
    db.user.create({
      data: {
        email: 'staff@example.com',
        name: 'Staff User',
        role: 'STAFF',
      },
    }),
  ]);

  console.log('✅ Users created');

  // Create demo transfers
  const transfers = await Promise.all([
    db.transfer.create({
      data: {
        transferNo: 'TRF-000001',
        fromLocationId: locations[0].id,
        toLocationId: locations[1].id,
        status: 'COMPLETED',
        notes: 'Regular stock replenishment',
        userId: users[0].id,
        completedAt: new Date('2025-06-15'),
        items: {
          create: [
            {
              productId: products[0].id,
              batchId: batches[0].id,
              quantity: 5,
              cost: 899.99,
            },
            {
              productId: products[1].id,
              quantity: 20,
              cost: 15.99,
            },
          ],
        },
      },
    }),
    db.transfer.create({
      data: {
        transferNo: 'TRF-000002',
        fromLocationId: locations[0].id,
        toLocationId: locations[2].id,
        status: 'IN_TRANSIT',
        notes: 'Urgent transfer for mall branch',
        userId: users[1].id,
        items: {
          create: [
            {
              productId: products[2].id,
              quantity: 50,
              cost: 8.99,
            },
            {
              productId: products[3].id,
              batchId: batches[2].id,
              quantity: 10,
              cost: 12.99,
            },
          ],
        },
      },
    }),
    db.transfer.create({
      data: {
        transferNo: 'TRF-000003',
        fromLocationId: locations[1].id,
        toLocationId: locations[3].id,
        status: 'PENDING',
        notes: 'Online store inventory request',
        userId: users[2].id,
        items: {
          create: [
            {
              productId: products[5].id,
              batchId: batches[4].id,
              quantity: 5,
              cost: 599.99,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Transfers created');

  // Create demo sales
  const sales = await Promise.all([
    db.sale.create({
      data: {
        invoiceNo: 'INV-001',
        totalAmount: 1329.98,
        discount: 0,
        tax: 0,
        finalAmount: 1329.98,
        status: 'completed',
        userId: users[2].id,
        locationId: locations[1].id,
        notes: 'Customer purchase',
        items: {
          create: [
            {
              productId: products[0].id,
              batchId: batches[1].id,
              quantity: 1,
              price: 1299.99,
              discount: 0,
              total: 1299.99,
            },
            {
              productId: products[1].id,
              quantity: 1,
              price: 29.99,
              discount: 0,
              total: 29.99,
            },
          ],
        },
      },
    }),
    db.sale.create({
      data: {
        invoiceNo: 'INV-002',
        totalAmount: 79.98,
        discount: 0,
        tax: 0,
        finalAmount: 79.98,
        status: 'completed',
        userId: users[2].id,
        locationId: locations[2].id,
        notes: 'Cash sale',
        items: {
          create: [
            {
              productId: products[2].id,
              quantity: 2,
              price: 19.99,
              discount: 0,
              total: 39.98,
            },
            {
              productId: products[6].id,
              quantity: 1,
              price: 39.99,
              discount: 0,
              total: 39.99,
            },
          ],
        },
      },
    }),
    db.sale.create({
      data: {
        invoiceNo: 'INV-003',
        totalAmount: 919.98,
        discount: 50,
        tax: 0,
        finalAmount: 869.98,
        status: 'completed',
        userId: users[1].id,
        locationId: locations[0].id,
        notes: 'Bulk purchase with discount',
        items: {
          create: [
            {
              productId: products[5].id,
              batchId: batches[4].id,
              quantity: 1,
              price: 899.99,
              discount: 50,
              total: 849.99,
            },
            {
              productId: products[7].id,
              batchId: batches[5].id,
              quantity: 1,
              price: 14.99,
              discount: 0,
              total: 14.99,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Sales created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });