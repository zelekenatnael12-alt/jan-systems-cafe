import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as orderService from '../src/services/orderService.js';
import * as tableService from '../src/services/tableService.js';

const prisma = new PrismaClient();

describe('Kitchen & Order Service Functions', () => {
  let venue;
  let shift;
  let product;
  let stockItem;
  let table;
  const mockIo = {
    to: () => ({
      emit: () => {}
    }),
    emit: () => {}
  };

  beforeAll(async () => {
    // 1. Create a dedicated test venue
    venue = await prisma.venue.upsert({
      where: { slug: 'venue-kds-test' },
      update: {},
      create: { 
        name: 'Venue KDS Test', 
        slug: 'venue-kds-test',
        configs: {
          create: {
            cafeName: 'Test Cafe',
            receiptHeader: 'Welcome to KDS Test'
          }
        }
      }
    });

    // ── CLEANUP SANITIZATION ──
    // Purge any stale test data from previous runs to ensure 100% clean test environment
    await prisma.inventoryLog.deleteMany({ where: { venueId: venue.id } });
    await prisma.payment.deleteMany({ where: { venueId: venue.id } });
    await prisma.orderItem.deleteMany({ where: { order: { venueId: venue.id } } });
    await prisma.order.deleteMany({ where: { venueId: venue.id } });
    await prisma.shift.deleteMany({ where: { venueId: venue.id } });
    await prisma.table.deleteMany({ where: { venueId: venue.id } });
    await prisma.ingredient.deleteMany({ where: { product: { venueId: venue.id } } });
    await prisma.product.deleteMany({ where: { venueId: venue.id } });
    await prisma.stockItem.deleteMany({ where: { venueId: venue.id } });

    // 2. Create an open shift
    shift = await prisma.shift.create({
      data: {
        venueId: venue.id,
        name: 'KDS Test Shift',
        openedBy: 'Test System',
        status: 'OPEN'
      }
    });

    // 3. Create a stock item (Coffee Beans)
    stockItem = await prisma.stockItem.create({
      data: {
        venueId: venue.id,
        name: 'Test Coffee Beans',
        amount: 1000,
        unit: 'grams',
        threshold: 100
      }
    });

    // 4. Create a product with stock item ingredients
    product = await prisma.product.create({
      data: {
        venueId: venue.id,
        name: 'KDS Macchiato',
        price: 50,
        category: 'Beverage',
        icon: '☕',
        ingredients: {
          create: [
            {
              stockItemId: stockItem.id,
              quantity: 15 // 15 grams per cup
            }
          ]
        }
      }
    });

    // 5. Create a table
    table = await prisma.table.create({
      data: {
        venueId: venue.id,
        number: 1,
        zone: 'MAIN',
        seats: 4,
        status: 'AVAILABLE'
      }
    });
  });

  // ── 1. PLACE ORDER FUNCTION TESTS ──────────────────────────────────────────
  describe('placeOrder()', () => {
    it('should successfully place a new order and bind to active shift', async () => {
      await tableService.updateTableStatus(venue.id, table.id, 'AVAILABLE');

      const orderData = {
        customer: 'John Doe',
        tableId: table.id,
        items: [
          {
            productId: product.id,
            quantity: 2 // Requires 30g total coffee beans
          }
        ],
        total: 100
      };

      const order = await orderService.placeOrder(venue.id, orderData);

      expect(order).toBeDefined();
      expect(order.venueId).toBe(venue.id);
      expect(order.status).toBe('NEW');
      expect(order.shiftId).toBe(shift.id);
      expect(order.total).toBe(100);
      expect(order.items.length).toBe(1);
      expect(order.items[0].productId).toBe(product.id);
      expect(order.items[0].quantity).toBe(2);
    });

    it('should throw an error if the table is occupied', async () => {
      // Set table to occupied
      await tableService.updateTableStatus(venue.id, table.id, 'OCCUPIED');

      const orderData = {
        customer: 'Jane Smith',
        tableId: table.id,
        items: [{ productId: product.id, quantity: 1 }],
        total: 50
      };

      await expect(orderService.placeOrder(venue.id, orderData))
        .rejects
        .toThrow('Table is already occupied.');

      // Restore table status
      await tableService.updateTableStatus(venue.id, table.id, 'AVAILABLE');
    });

    it('should throw an error if the table does not exist or belongs to another venue', async () => {
      const orderData = {
        customer: 'Ghost Guest',
        tableId: 'non-existent-table-id',
        items: [{ productId: product.id, quantity: 1 }],
        total: 50
      };

      await expect(orderService.placeOrder(venue.id, orderData))
        .rejects
        .toThrow();
    });
  });

  // ── 2. UPDATE STATUS FUNCTION TESTS ─────────────────────────────────────────
  describe('updateStatus()', () => {
    it('should transition status smoothly through KDS states (NEW -> PREPARING -> READY -> DONE)', async () => {
      // Reset table status and place the order
      await tableService.updateTableStatus(venue.id, table.id, 'AVAILABLE');
      
      const freshOrder = await orderService.placeOrder(venue.id, {
        customer: 'Timer Test',
        tableId: table.id,
        items: [{ productId: product.id, quantity: 2 }],
        total: 100
      });

      // Simulate waiter marking table as occupied
      await tableService.updateTableStatus(venue.id, table.id, 'OCCUPIED');

      // 2. NEW -> PREPARING
      const preparingOrder = await orderService.updateStatus(venue.id, freshOrder.id, 'PREPARING', null, mockIo);
      expect(preparingOrder.status).toBe('PREPARING');

      // 3. PREPARING -> READY
      const readyOrder = await orderService.updateStatus(venue.id, freshOrder.id, 'READY', null, mockIo);
      expect(readyOrder.status).toBe('READY');

      // Check stock before completion (should still be 1000 since it only decrements on DONE)
      let currentStock = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
      expect(currentStock.amount).toBe(1000);

      // 4. READY -> DONE (Completed with payment)
      const doneOrder = await orderService.updateStatus(venue.id, freshOrder.id, 'DONE', 'TELEBIRR', mockIo);
      expect(doneOrder.status).toBe('DONE');
      expect(doneOrder.paymentMethod).toBe('TELEBIRR');

      // 5. Verification of Inventory Decrements (DONE hook)
      currentStock = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
      // 2 cups * 15g = 30g used. 1000 - 30 = 970
      expect(currentStock.amount).toBe(970);

      // 6. Verification of InventoryLog creation
      const log = await prisma.inventoryLog.findFirst({
        where: { orderId: freshOrder.id, stockItemId: stockItem.id }
      });
      expect(log).toBeDefined();
      expect(log.venueId).toBe(venue.id);
      expect(log.change).toBe(-30);
      expect(log.reason).toBe(`Order Completed: ${freshOrder.id}`);

      // 7. Verification of Payment creation
      const payment = await prisma.payment.findFirst({
        where: { orderId: freshOrder.id }
      });
      expect(payment).toBeDefined();
      expect(payment.venueId).toBe(venue.id);
      expect(payment.amount).toBe(100);
      expect(payment.method).toBe('TELEBIRR');

      // 8. Verification of Table Release
      const updatedTable = await prisma.table.findUnique({ where: { id: table.id } });
      expect(updatedTable.status).toBe('AVAILABLE');
    });

    it('should correctly release table on order CANCELLED', async () => {
      // 1. Setup available table and new order
      await tableService.updateTableStatus(venue.id, table.id, 'AVAILABLE');
      const freshOrder = await orderService.placeOrder(venue.id, {
        customer: 'Cancel Test',
        tableId: table.id,
        items: [{ productId: product.id, quantity: 1 }],
        total: 50
      });

      // Simulate table becoming occupied
      await tableService.updateTableStatus(venue.id, table.id, 'OCCUPIED');

      // 2. Cancel order
      const cancelledOrder = await orderService.updateStatus(venue.id, freshOrder.id, 'CANCELLED', null, mockIo);
      expect(cancelledOrder.status).toBe('CANCELLED');

      // 3. Table should be released
      const updatedTable = await prisma.table.findUnique({ where: { id: table.id } });
      expect(updatedTable.status).toBe('AVAILABLE');
    });
  });

  // ── 3. VOID ORDER FUNCTION TESTS ────────────────────────────────────────────
  describe('voidOrder()', () => {
    it('should successfully void a DONE order and reverse inventory usage', async () => {
      // 1. Reset stock item back to 1000 for a clean start on void test
      await prisma.stockItem.update({
        where: { id: stockItem.id },
        data: { amount: 1000 }
      });

      // 2. Create order
      await tableService.updateTableStatus(venue.id, table.id, 'AVAILABLE');
      const freshOrder = await orderService.placeOrder(venue.id, {
        customer: 'Void Target',
        tableId: table.id,
        items: [{ productId: product.id, quantity: 4 }], // 4 cups * 15g = 60g beans
        total: 200
      });

      // Simulate table becoming occupied
      await tableService.updateTableStatus(venue.id, table.id, 'OCCUPIED');

      // 3. Transition it to DONE to apply initial decrement (Stock: 1000 - 60 = 940)
      await orderService.updateStatus(venue.id, freshOrder.id, 'DONE', 'CASH', mockIo);

      // Verify stock level before voiding
      let beforeStock = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
      expect(beforeStock.amount).toBe(940);

      // 4. Void the order
      const voidReason = 'Kitchen burnt the toast';
      const voidedOrder = await orderService.voidOrder(venue.id, freshOrder.id, voidReason, mockIo);

      // 5. Assertions on order details
      expect(voidedOrder.status).toBe('VOIDED');
      expect(voidedOrder.voidReason).toBe(voidReason);
      expect(voidedOrder.voidedAt).toBeInstanceOf(Date);

      // 6. Assertions on Stock Reversal (Should increment back by 60g: 940 + 60 = 1000)
      let afterStock = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
      expect(afterStock.amount).toBe(1000);

      // 7. Assertions on InventoryLog reversal entry
      const log = await prisma.inventoryLog.findFirst({
        where: { 
          orderId: freshOrder.id, 
          stockItemId: stockItem.id,
          change: 60
        }
      });
      expect(log).toBeDefined();
      expect(log.venueId).toBe(venue.id);
      expect(log.reason).toBe(`Void Order: ${freshOrder.id} - ${voidReason}`);
    });

    it('should throw an error when voiding an order that is NOT DONE', async () => {
      const freshOrder = await orderService.placeOrder(venue.id, {
        customer: 'Invalid Void Target',
        items: [{ productId: product.id, quantity: 1 }],
        total: 50
      });

      await expect(orderService.voidOrder(venue.id, freshOrder.id, 'No reason', mockIo))
        .rejects
        .toThrow('Only completed orders can be voided.');
    });

    it('should throw an error when voiding without a reason', async () => {
      const freshOrder = await orderService.placeOrder(venue.id, {
        customer: 'No Reason Target',
        items: [{ productId: product.id, quantity: 1 }],
        total: 50
      });
      await orderService.updateStatus(venue.id, freshOrder.id, 'DONE', 'CASH', mockIo);

      await expect(orderService.voidOrder(venue.id, freshOrder.id, '', mockIo))
        .rejects
        .toThrow('Void reason is mandatory.');
    });
  });

  // ── 4. GET ORDERS FUNCTION TESTS ────────────────────────────────────────────
  describe('getOrders()', () => {
    it('should scope orders exclusively to the venue and support pagination', async () => {
      // 1. Get orders for our test venue
      const orders = await orderService.getOrders(venue.id);
      expect(orders.length).toBeGreaterThanOrEqual(1);

      // Every returned order must match the venueId
      orders.forEach(o => {
        expect(o.venueId).toBe(venue.id);
      });

      // 2. Test limit/offset paging
      const pagedOrders = await orderService.getOrders(venue.id, {}, 1, 0);
      expect(pagedOrders.length).toBe(1);
    });
  });
});
