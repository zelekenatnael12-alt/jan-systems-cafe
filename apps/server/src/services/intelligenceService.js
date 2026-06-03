// apps/server/src/services/intelligenceService.js
import prisma from '../lib/prisma.js';

export const getSuggestedCalibrations = async (venueId) => {
  const products = await prisma.product.findMany({
    where: { venueId },
    include: {
      ingredients: {
        include: { stockItem: true }
      },
      orderItems: true
    }
  });

  const suggestions = [];

  for (const product of products) {
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Only suggest if we have enough data (e.g., 5+ orders)
    if (totalSold < 5) continue;

    for (const ingredient of product.ingredients) {
      // Find manual logs for this stock item since the product was created
      const manualLogs = await prisma.inventoryLog.findMany({
        where: {
          venueId,
          stockItemId: ingredient.stockItemId,
          reason: { notIn: ['Order Completed', 'Initial registration'] },
          timestamp: { gte: product.createdAt }
        }
      });

      const unaccountedChange = manualLogs.reduce((sum, log) => sum + log.change, 0);
      
      // If unaccounted change is negative, it means we are using MORE than expected.
      // If positive, it means we are using LESS than expected.
      // We calculate a 'Correction Factor' based on how many items were sold.
      
      const theoreticalTotalUsed = totalSold * ingredient.quantity;
      const actualTotalUsed = theoreticalTotalUsed - unaccountedChange; // minus because unaccountedChange is negative for loss
      
      const suggestedQuantity = actualTotalUsed / totalSold;
      
      // Only suggest if the difference is significant (> 5%)
      const diffPercent = Math.abs((suggestedQuantity - ingredient.quantity) / ingredient.quantity);
      
      if (diffPercent > 0.05) {
        suggestions.push({
          productId: product.id,
          productName: product.name,
          stockItemId: ingredient.stockItemId,
          stockItemName: ingredient.stockItem.name,
          currentQuantity: ingredient.quantity,
          suggestedQuantity: parseFloat(suggestedQuantity.toFixed(4)),
          diffPercent: parseFloat((diffPercent * 100).toFixed(1)),
          confidence: totalSold > 20 ? 'HIGH' : 'MEDIUM'
        });
      }
    }
  }

  return suggestions;
};
