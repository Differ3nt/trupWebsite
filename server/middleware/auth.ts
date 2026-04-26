import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Wymagane logowanie', code: 'UNAUTHENTICATED' });
    }

    // Weryfikacja tokenu przy użyciu klucza JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; role?: string };
    
    // Przypisanie danych do obiektu request, aby były dostępne w ruterach
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
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
    return res.status(403).json({ error: 'Brak uprawnień administratora', code: 'FORBIDDEN' });
  }
  next();
}
