import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request } from 'express';

dotenv.config();

// JWT secret from environment variables
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
const jwtExpiration = process.env.JWT_EXPIRATION || '24h';

/**
 * Generate a JWT token for a user
 * @param userId - The user ID to encode in the token
 * @returns The JWT token
 */
const generateToken = (userId: number): string => {
  // @ts-ignore - Using valid jwt.sign parameters but TypeScript has issues with the types
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiration });
};

/**
 * Verify a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 */
const verifyToken = (token: string): any => {
  // @ts-ignore - Using valid jwt.verify parameters but TypeScript has issues with the types
  return jwt.verify(token, jwtSecret);
};

/**
 * Extract the JWT token from the request
 * @param req - The Express request object
 * @returns The JWT token or null if not found
 */
const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  return null;
};

export { 
  jwtSecret, 
  jwtExpiration, 
  generateToken, 
  verifyToken, 
  extractTokenFromRequest 
}; 