// apps/server/src/services/configService.js
import prisma from '../lib/prisma.js';

export const getConfig = async (venueId) => {
  return await prisma.cafeConfig.findFirst({
    where: { venueId }
  });
};

export const updateConfig = async (venueId, data) => {
  const config = await prisma.cafeConfig.findFirst({
    where: { venueId }
  });
  if (!config) throw new Error('Venue not found.');
  
  return await prisma.cafeConfig.update({
    where: { id: config.id },
    data
  });
};

export const initConfig = async (venueId, data) => {
  const existing = await prisma.cafeConfig.findFirst({
    where: { venueId }
  });
  if (existing) throw new Error('Venue already initialized.');
  
  return await prisma.cafeConfig.create({
    data: {
      ...data,
      venueId
    }
  });
};
