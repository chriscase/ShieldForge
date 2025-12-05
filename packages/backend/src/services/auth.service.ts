import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION || '86400', 10);

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface JwtPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthPayload> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + JWT_EXPIRATION * 1000),
    },
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, sessionId: session.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + JWT_EXPIRATION * 1000),
    },
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, sessionId: session.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function logout(token: string): Promise<{ message: string; success: boolean }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Delete session
    await prisma.session.delete({
      where: { id: decoded.sessionId },
    });

    return { message: 'Logged out successfully', success: true };
  } catch {
    return { message: 'Invalid token', success: false };
  }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Find session
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update last access
    await prisma.session.update({
      where: { id: session.id },
      data: { lastAccessAt: new Date() },
    });

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(token: string): Promise<AuthUser | null> {
  return verifyToken(token);
}
