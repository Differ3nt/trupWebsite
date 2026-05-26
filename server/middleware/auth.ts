import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

/**
 * Rozszerzony interfejs Request zawierający dane o zalogowanym użytkowniku.
 */
export interface AuthRequest extends Request {
  userId?: string;   // ID użytkownika z bazy danych
  userRole?: string; // Rola użytkownika (np. USER, ADMIN)
}

/**
 * Middleware sprawdzający czy użytkownik jest zalogowany.
 * Weryfikuje token JWT przesłany w ciasteczku 'token'.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Wymagane logowanie', code: 'UNAUTHENTICATED' });
    }

    // Weryfikacja tokenu przy użyciu klucza JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    
    // Przypisanie danych do obiektu request
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Jeśli w tokenie brakuje roli (stary token), pobieramy ją z bazy
    if (!req.userRole) {
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
      if (user) req.userRole = user.role;
    }
    
    next();

  } catch (error) {
    return res.status(401).json({ error: 'Nieprawidłowy lub wygasły token', code: 'INVALID_TOKEN' });
  }
}

/**
 * Middleware sprawdzający czy zalogowany użytkownik posiada rolę ADMIN.
 * Musi być używany PO middleware authenticate.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    console.log(`ODMOWA DOSTĘPU ADMINA: Użytkownik ${req.userId} ma rolę ${req.userRole}`);
    return res.status(403).json({ error: 'Brak uprawnień administratora', code: 'FORBIDDEN' });
  }
  next();
}

export function getUserIdFromCookie(req: any): string | null {
  const user = getUserFromCookie(req);
  return user?.userId ?? null;
}

export function getUserFromCookie(req: any): { userId: string; role: string } | null {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

