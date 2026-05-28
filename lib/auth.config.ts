import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  callbacks: {
    authorized() {
      return true;
    },
  },
} satisfies NextAuthConfig;
