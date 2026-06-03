// apps/server/src/services/authService.js
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'jan_refresh_secret';

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return { 
    token: accessToken, 
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, name: user.name, venueId: user.venueId } 
  };
};

export const refresh = async (token) => {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const tokens = generateTokens(user);

    // Rotate refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return { 
      token: tokens.accessToken, 
      refreshToken: tokens.refreshToken 
    };
  } catch (err) {
    throw new Error('Refresh failed');
  }
};

export const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, venueId: user.venueId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword
    }
  });
};
