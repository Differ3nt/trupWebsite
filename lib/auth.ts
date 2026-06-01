import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Initial sign-in: persist identity and the issue time.
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, status: true },
        });
        token.id = user.id;
        token.role = (dbUser?.role ?? 'USER') as 'USER' | 'ADMIN';
        token.status = (dbUser?.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
        token.authTime = Math.floor(Date.now() / 1000);
        return token;
      }

      // Subsequent requests: re-validate against the DB so logout, role and
      // status changes take effect immediately (server-side session revocation).
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true, lastLogoutAt: true },
        });
        // Account deleted → kill the session.
        if (!dbUser) return null;
        // Logged out after this token was issued (on any device) → kill it.
        if (
          dbUser.lastLogoutAt &&
          token.authTime &&
          dbUser.lastLogoutAt.getTime() > token.authTime * 1000
        ) {
          return null;
        }
        token.role = dbUser.role as 'USER' | 'ADMIN';
        token.status = dbUser.status as 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
  events: {
    // Stamp the logout time so every JWT issued before now is rejected by the
    // jwt callback above. Logging out invalidates the user's sessions everywhere.
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.id) {
        await prisma.user
          .update({ where: { id: token.id }, data: { lastLogoutAt: new Date() } })
          .catch(() => {});
      }
    },
  },
});
