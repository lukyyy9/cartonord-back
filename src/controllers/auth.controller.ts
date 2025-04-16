import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { generateToken } from '../config/auth';
import { ApiError } from '../middlewares/error.middleware';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Check if the email is already in use
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError(400, 'Email already in use');
      }

      // Create the user
      const user = await User.create({
        username,
        email,
        password,
        isAdmin: false, // New users are not admins by default
      });

      // Generate token
      const token = generateToken(user.id);

      // Return user data without password
      const userData = user.toJSON();
      delete userData.password;

      res.status(201).json({
        user: userData,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login a user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find the user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Verify the password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Generate token
      const token = generateToken(user.id);

      // Return user data without password
      const userData = user.toJSON();
      delete userData.password;

      res.status(200).json({
        user: userData,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the current user's profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Return user data without password
      const userData = user.toJSON();
      delete userData.password;

      res.status(200).json({
        user: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.id;
      const { username, email, password } = req.body;

      // If email is being updated, check if it's already in use
      if (email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          throw new ApiError(400, 'Email already in use');
        }
      }

      // Update the user
      await User.update(
        {
          username,
          email,
          password,
        },
        {
          where: {
            id: userId,
          },
          individualHooks: true // Ensure hooks like password hashing run
        }
      );

      // Fetch the updated user
      const updatedUser = await User.findByPk(userId);
      
      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }

      // Return user data without password
      const userData = updatedUser.toJSON();
      delete userData.password;

      res.status(200).json({
        user: userData,
      });
    } catch (error) {
      next(error);
    }
  }
} 