/**
 * Authentication Templates
 * 
 * Reusable auth component templates for AI-generated applications.
 * Provides consistent auth patterns across generated apps.
 * 
 * @module lib/auth/templates
 */

export interface ComponentTemplates {
  loginForm: string;
  registerForm: string;
  authLayout: string;
  authMiddleware: string;
  sessionProvider: string;
}

export interface HookTemplates {
  useAuth: string;
  useRequireAuth: string;
}

/**
 * Get React login form component template
 */
export function getLoginFormComponent(): string {
  return `'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-center text-sm">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}`;
}

/**
 * Get React registration form component template
 */
export function getRegisterFormComponent(): string {
  return `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create account');
      }

      router.push('/auth/signin?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          minLength={8}
          className="mt-1 block w-full rounded border px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}`;
}

/**
 * Get auth layout with SessionProvider wrapper
 */
export function getAuthLayout(): string {
  return `'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}`;
}

/**
 * Get middleware template for protecting routes
 */
export function getAuthMiddleware(): string {
  return `import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Protected routes pattern
export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};

export default withAuth(
  function middleware(req) {
    // Check if user has required role
    const token = req.nextauth.token;
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // Add custom role checks here if needed
    // if (req.nextUrl.pathname.startsWith('/admin') && token.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/unauthorized', req.url));
    // }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow public pages
        if (req.nextUrl.pathname.startsWith('/public')) {
          return true;
        }
        return token !== null;
      },
    },
  }
);`;
}

/**
 * Get session provider template for root layout
 */
export function getSessionProvider(): string {
  return `'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}`;
}

/**
 * Get useSession hook usage pattern
 */
export function getSessionHook(): string {
  return `'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}

// Usage in components:
// const { user, isAuthenticated, isLoading, logout } = useAuth();`;
}

/**
 * Get registration API route template
 */
export function getRegisterApiRoute(): string {
  return `import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/auth/validators';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser(email, password, name);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    );
  }
}`;
}

/**
 * Get all auth component templates
 */
export function getAuthComponents(): ComponentTemplates {
  return {
    loginForm: getLoginFormComponent(),
    registerForm: getRegisterFormComponent(),
    authLayout: getAuthLayout(),
    authMiddleware: getAuthMiddleware(),
    sessionProvider: getSessionProvider(),
  };
}

/**
 * Get all auth hook templates
 */
export function getAuthHooks(): HookTemplates {
  return {
    useAuth: getSessionHook(),
    useRequireAuth: `// HOC for requiring authentication
export function withRequireAuth(Component: React.ComponentType) {
  return function RequireAuth(props: any) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/signin');
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };
}`,
  };
}

export default {
  getLoginFormComponent,
  getRegisterFormComponent,
  getAuthLayout,
  getAuthMiddleware,
  getSessionProvider,
  getSessionHook,
  getRegisterApiRoute,
  getAuthComponents,
  getAuthHooks,
};