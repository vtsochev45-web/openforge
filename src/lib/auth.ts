/**
 * NextAuth.js (Auth.js) Configuration
 * 
 * Complete authentication setup for OpenForge generated applications.
 * Supports credentials provider with bcrypt password hashing.
 * 
 * @module lib/auth
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    password?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  image?: string | null;
}

export interface AuthConfig {
  providers: string[];
  callbacks?: Record<string, unknown>;
  pages?: {
    signIn?: string;
    signUp?: string;
    error?: string;
    verifyRequest?: string;
    newUser?: string;
  };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User ${user.email} signed in${isNewUser ? ' (new user)' : ''}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Helper to get session server-side
 * Note: Use getServerSession from next-auth in actual route handlers
 */
export async function getAuthSession() {
  // This is a placeholder - import getServerSession from 'next-auth' in actual API routes
  return null;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: string): boolean {
  if (!user) return false;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return user.role === 'admin';
  return user.role === requiredRole;
}

/**
 * Require authentication middleware helper
 */
export function requireAuth(
  handler: (user: AuthUser) => Promise<Response>
): (user: AuthUser | null) => Promise<Response> {
  return async (user: AuthUser | null) => {
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(user);
  };
}

/**
 * Create a new user with hashed password
 */
export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'user',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
    },
  });

  return user as AuthUser;
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export default authOptions;