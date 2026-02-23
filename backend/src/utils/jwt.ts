import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret as jwt.Secret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret as jwt.Secret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};

export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutos en segundos
  };
};

export const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

export const removeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.delete({
    where: { token },
  });
};

export const validateRefreshToken = async (token: string): Promise<boolean> => {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!tokenRecord) return false;
  if (tokenRecord.expiresAt < new Date()) {
    await removeRefreshToken(token);
    return false;
  }

  return true;
};
