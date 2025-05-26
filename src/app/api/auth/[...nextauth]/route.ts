import NextAuth from 'next-auth/next';
import { authOptions } from './authOptions';

// Validate environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add proper type declarations for the session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    }
  }
  interface User {
    role: string;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
} 