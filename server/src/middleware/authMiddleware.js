import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth/authService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'companybrain_super_secure_jwt_secret_key_2026_enterprise';

/**
 * Authenticate incoming request via Bearer JWT and populate req.user with verified tenant context
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or malformed Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token. Please log in again.',
      });
    }

    // Hydrate complete verified profile from database
    const user = await AuthService.getUserFullProfile(decoded.userId, decoded.tenantId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account associated with token no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: `User account is ${user.status}. Access denied.`,
      });
    }

    // Set secure user context on request object
    // CRITICAL: All downstream controllers use req.user.tenant_id, NEVER trusting req.body.tenant_id
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, error: 'Internal security authentication error.' });
  }
}

/**
 * Enforce required role permissions
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // Super Admin has universal access
    if (req.user.role_name === 'Super Admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] roles. Your role is [${req.user.role_name}].`,
      });
    }

    next();
  };
}

/**
 * Shortcut for administrative operations
 */
export const requireAdmin = requireRole(['Company Admin', 'Super Admin']);
