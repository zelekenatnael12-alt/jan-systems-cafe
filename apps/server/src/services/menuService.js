// apps/server/src/services/menuService.js
import prisma from '../lib/prisma.js';
import * as imageService from './imageService.js';

export const getAllProducts = async (venueId) => {
  return await prisma.product.findMany({
    where: { 
      venueId,
      isDeleted: false 
    },
    include: { 
      ingredients: {
        include: { stockItem: true }
      }
    }
  });
};

export const createProduct = async (venueId, data) => {
  const { ingredients, ...prodData } = data;
  return await prisma.product.create({
    data: {
      ...prodData,
      venueId,
      ingredients: {
        create: ingredients?.map(ing => ({
          stockItemId: ing.stockItemId,
          quantity: ing.quantity
        })) || []
      }
    }
  });
};

export const updateProduct = async (venueId, id, data) => {
  const { ingredients, ...prodData } = data;
  return await prisma.product.update({
    where: { 
      id,
      venueId // Ensure we only update products belonging to the venue
    },
    data: {
      ...prodData,
      ingredients: {
        deleteMany: {},
        create: ingredients?.map(ing => ({
          stockItemId: ing.stockItemId,
          quantity: ing.quantity
        })) || []
      }
    }
  });
};

export const deleteProduct = async (venueId, id) => {
  return await prisma.product.update({ 
    where: { 
      id,
      venueId
    },
    data: { isDeleted: true }
  });
};
