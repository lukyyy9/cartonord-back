// User model types
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateDTO {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
}

// Map model types
export interface Map {
  id: number;
  title: string;
  description: string;
  slug: string;
  dataFileUrl: string;
  styleFileUrl: string;
  legendFileUrl: string;
  imageFileUrl: string;
  isPublished: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapCreateDTO {
  title: string;
  description: string;
  slug?: string;
  dataFileUrl?: string;
  styleFileUrl?: string;
  legendFileUrl?: string;
  imageFileUrl?: string;
  isPublished?: boolean;
  userId: number;
}

export interface MapUpdateDTO {
  title?: string;
  description?: string;
  slug?: string;
  dataFileUrl?: string;
  styleFileUrl?: string;
  legendFileUrl?: string;
  imageFileUrl?: string;
  isPublished?: boolean;
  userId?: number;
}

// File upload types
export interface FileUploadRequest {
  mapId: string;
  fileType: 'data' | 'style' | 'legend' | 'image';
  contentType: string;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: number;
}

// Express types
import { Request, Response, NextFunction } from 'express';
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void; 