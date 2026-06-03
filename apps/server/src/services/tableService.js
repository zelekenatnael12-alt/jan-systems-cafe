// apps/server/src/services/tableService.js
import prisma from '../lib/prisma.js';

export const getAllTables = async (venueId) => {
  return await prisma.table.findMany({
    where: { venueId },
    orderBy: { number: 'asc' }
  });
};

export const updateTableStatus = async (venueId, tableId, status, io) => {
  const updated = await prisma.table.update({
    where: { 
      id: tableId,
      venueId
    },
    data: { status }
  });

  if (io) {
    io.emit('table:updated', updated);
  }

  return updated;
};

export const createTable = async (venueId, data) => {
  return await prisma.table.create({ 
    data: {
      ...data,
      venueId
    } 
  });
};

export const updateTable = async (venueId, id, data) => {
  return await prisma.table.update({
    where: { 
      id,
      venueId
    },
    data
  });
};

export const deleteTable = async (venueId, id) => {
  return await prisma.table.delete({ 
    where: { 
      id,
      venueId
    } 
  });
};
