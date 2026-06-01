import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'USER' | 'ADMIN';
      status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
    /** Unix seconds when this token was first issued (set at sign-in, never updated). Used for logout-based revocation. */
    authTime: number;
  }
}
