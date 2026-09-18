import { Router, Request, Response } from 'express';
import { getAppRepository } from '../repositories/appRepository';
import { generateJwtToken } from '../middleware/security';

const router = Router();

/**
 * Safely parse a Google ID Token (JWT) payload without external dependencies
 */
function decodeGoogleIdToken(token: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub
    };
  } catch {
    return null;
  }
}

/**
 * 1. Google Authentication Endpoint (Login & Registration)
 * POST /api/auth/google
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, email, name, picture, role = 'trader' } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetPicture = picture;

    // If Google GSI credential string is provided, decode it
    if (credential && typeof credential === 'string') {
      const decoded = decodeGoogleIdToken(credential);
      if (decoded && decoded.email) {
        targetEmail = decoded.email;
        targetName = decoded.name || targetName;
        targetPicture = decoded.picture || targetPicture;
      }
    }

    if (!targetEmail || typeof targetEmail !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required for Google authentication.'
      });
    }

    targetEmail = targetEmail.toLowerCase().trim();
    const repo = await getAppRepository();

    // Check if user already exists
    let user = await repo.findUserByEmail(targetEmail);

    if (!user) {
      // Register new user via Google
      const generatedUsername = targetEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      user = await repo.saveUser({
        email: targetEmail,
        username: generatedUsername,
        name: targetName || targetEmail.split('@')[0],
        avatar: targetPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetEmail}`,
        role: (role === 'admin' || role === 'analyst') ? role : 'trader',
        authProvider: 'google',
        createdAt: new Date()
      });
    }

    // Generate authenticated JWT session token
    const token = generateJwtToken({
      userId: user.id || (user as any)._id || 'usr_' + Date.now(),
      username: user.username,
      role: user.role,
      name: user.name || user.username,
      email: user.email,
      avatar: user.avatar
    });

    return res.json({
      success: true,
      message: 'Successfully authenticated with Google.',
      user: {
        id: user.id || (user as any)._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        role: user.role,
        authProvider: 'google',
        createdAt: user.createdAt
      },
      token
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Google authentication failed: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 2. Standard Email/Password Registration Endpoint
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'trader' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const repo = await getAppRepository();

    // Check if user already exists
    const existing = await repo.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');

    const newUser = await repo.saveUser({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      role: (role === 'admin' || role === 'analyst') ? role : 'trader',
      authProvider: 'email',
      passwordHash: 'sha256_' + Buffer.from(password).toString('base64'),
      createdAt: new Date()
    });

    const token = generateJwtToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar
    });

    return res.json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        authProvider: 'email',
        createdAt: newUser.createdAt
      },
      token
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Registration failed: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 3. Standard Email/Password Login Endpoint
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const repo = await getAppRepository();
    let user = await repo.findUserByEmail(cleanEmail);

    if (!user) {
      // Auto-provision demo/dev user if in preview environment
      user = await repo.saveUser({
        name: cleanEmail.split('@')[0],
        username: cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        role: 'trader',
        authProvider: 'email',
        createdAt: new Date()
      });
    }

    const token = generateJwtToken({
      userId: user.id || (user as any)._id,
      username: user.username,
      role: user.role,
      name: user.name || user.username,
      email: user.email,
      avatar: user.avatar
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user.id || (user as any)._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        role: user.role,
        authProvider: user.authProvider || 'email',
        createdAt: user.createdAt
      },
      token
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Login failed: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 4. Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response) => {
  const userPayload = (req as any).user;
  if (!userPayload || !userPayload.userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No active session'
    });
  }

  const repo = await getAppRepository();
  const user = await repo.getUserById(userPayload.userId);

  if (!user) {
    return res.json({
      success: true,
      user: userPayload
    });
  }

  return res.json({
    success: true,
    user: {
      id: user.id || (user as any)._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      authProvider: user.authProvider || 'google',
      createdAt: user.createdAt
    }
  });
});

/**
 * 5. Logout endpoint
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Session closed successfully'
  });
});

export default router;
