// apps/server/src/services/orderService.js
import prisma from '../lib/prisma.js';

export const placeOrder = async (venueId, orderData) => {
  const { customer, items, total, tableId } = orderData;
  
  if (tableId) {
    const table = await prisma.table.findUnique({ 
      where: { 
        id: tableId,
        venueId
      } 
    });
    if (!table) throw new Error('Table not found.');
    if (table.status === 'OCCUPIED') throw new Error('Table is already occupied.');
  }

  return await prisma.$transaction(async (tx) => {
    // Table check already done above, but we do it again in transaction to ensure atomicity
    if (tableId) {
      const table = await tx.table.findUnique({ 
        where: { 
          id: tableId,
          venueId
        } 
      });
      if (!table) throw new Error('Table not found.');
      if (table.status === 'OCCUPIED') throw new Error('Table is already occupied.');
    }

    // ── Phase 2: Get Current Shift ──
    const currentShift = await tx.shift.findFirst({
      where: { 
        venueId,
        status: 'OPEN' 
      }
    });

    // 2. Create the order
    const order = await tx.order.create({
      data: {
        venueId,
        customer,
        tableId,
        shiftId: currentShift?.id,
        status: 'NEW',
        total: total || 0,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: {
                  include: { stockItem: true }
                }
              }
            }
          }
        }
      }
    });

    return order;
  });
};

export const updateStatus = async (venueId, orderId, status, paymentMethod, io) => {
  return await prisma.$transaction(async (tx) => {
    // Guard: Cannot modify a voided order
    const currentOrder = await tx.order.findUnique({ 
      where: { 
        id: orderId,
        venueId
      } 
    });
    if (currentOrder.status === 'VOIDED') {
      throw new Error('Cannot update a voided order.');
    }

    const updateData = { status };
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    const order = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: {
                  include: { stockItem: true }
                }
              }
            }
          }
        }
      }
    });

    // ── V3 Inventory Decrement Hook ──
    if (status === 'DONE') {
      console.log(`Order ${orderId} COMPLETED. Calculating precise ingredient usage...`);
      
      for (const item of order.items) {
        for (const ingredient of item.product.ingredients) {
          const totalUsed = ingredient.quantity * item.quantity;
          
          const updatedStock = await tx.stockItem.update({
            where: { id: ingredient.stockItemId },
            data: {
              amount: { decrement: totalUsed }
            }
          });

          // Log the inventory change
          await tx.inventoryLog.create({
            data: {
              venueId,
              stockItemId: ingredient.stockItemId,
              orderId: order.id,
              change: -totalUsed,
              reason: `Order Completed: ${order.id}`
            }
          });

          // Live Sync via Socket.IO
          if (io) {
            io.to('admin').emit('inventory:updated', updatedStock);
            if (updatedStock.amount <= updatedStock.threshold) {
              io.to('admin').emit('inventory:low', updatedStock);
            }
          }
        }
      }

      // Create Payment Record atomically
      const finalPaymentMethod = paymentMethod || order.paymentMethod || 'CASH';
      await tx.payment.create({
        data: {
          venueId,
          orderId: order.id,
          amount: order.total,
          method: finalPaymentMethod,
          note: `Auto-generated on completion`
        }
      });
      // ── Phase 2: Release Table ──
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    // ── Phase 2: Handle Cancellation Release ──
    if (status === 'CANCELLED') {
      const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (currentOrder.tableId) {
        await tx.table.update({
          where: { id: currentOrder.tableId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    return order;
  });
};

export const voidOrder = async (venueId, orderId, voidReason, io) => {
  if (!voidReason) throw new Error('Void reason is mandatory.');

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch order and verify it's DONE and not already VOIDED
    const order = await tx.order.findUnique({
      where: { 
        id: orderId,
        venueId
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: {
                  include: { stockItem: true }
                }
              }
            }
          }
        }
      }
    });

    if (!order) throw new Error('Order not found.');
    if (order.status !== 'DONE') throw new Error('Only completed orders can be voided.');
    if (order.status === 'VOIDED') throw new Error('Order is already voided.');

    console.log(`Order ${orderId} VOIDING. Reversing ingredient usage...`);

    // 2. Reverse every inventory change tied to this order
    for (const item of order.items) {
      for (const ingredient of item.product.ingredients) {
        const totalToReturn = ingredient.quantity * item.quantity;
        
        const updatedStock = await tx.stockItem.update({
          where: { id: ingredient.stockItemId },
          data: {
            amount: { increment: totalToReturn }
          }
        });

        // Log the inventory reversal (Equal and opposite)
        await tx.inventoryLog.create({
          data: {
            venueId,
            stockItemId: ingredient.stockItemId,
            orderId: order.id,
            change: totalToReturn,
            reason: `Void Order: ${order.id} - ${voidReason}`
          }
        });

        // Live Sync via Socket.IO
        if (io) {
          io.to('admin').emit('inventory:updated', updatedStock);
        }
      }
    }

    // 3. Finalize Order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidReason: voidReason
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 4. Release Table
    if (order.tableId) {
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });
    }

    return updatedOrder;
  });
};

export const getOrders = async (venueId, filters = {}, limit = 100, offset = 0) => {
  return await prisma.order.findMany({
    where: {
      ...filters,
      venueId
    },
    take: Number(limit),
    skip: Number(offset),
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};
