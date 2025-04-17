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
  description?: string;
  slug: string;
  location?: string;
  
  // GeoJSON layer URLs
  urbanGeojsonUrl?: string;
  roadsGeojsonUrl?: string;
  waterGeojsonUrl?: string;
  buildingsGeojsonUrl?: string;
  greenAreasGeojsonUrl?: string;
  poisGeojsonUrl?: string;
  
  // Additional files
  renderedImageUrl?: string;
  pdfExportUrl?: string;
  pictosFolderUrl?: string;
  logosFolderUrl?: string;
  
  // Legacy fields
  dataFileUrl?: string;
  styleFileUrl?: string;
  legendFileUrl?: string;
  imageFileUrl?: string;
  
  // Additional metadata
  geojsonLayers?: object;
  
  isPublished: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapCreateDTO {
  title: string;
  description?: string;
  slug?: string;
  location?: string;
  
  // GeoJSON layer URLs
  urbanGeojsonUrl?: string;
  roadsGeojsonUrl?: string;
  waterGeojsonUrl?: string;
  buildingsGeojsonUrl?: string;
  greenAreasGeojsonUrl?: string;
  poisGeojsonUrl?: string;
  
  // Additional files
  renderedImageUrl?: string;
  pdfExportUrl?: string;
  pictosFolderUrl?: string;
  logosFolderUrl?: string;
  
  // Legacy fields
  dataFileUrl?: string;
  styleFileUrl?: string;
  legendFileUrl?: string;
  imageFileUrl?: string;
  
  // Additional metadata
  geojsonLayers?: object;
  
  isPublished?: boolean;
  userId: number;
}

export interface MapUpdateDTO {
  title?: string;
  description?: string;
  slug?: string;
  location?: string;
  
  // GeoJSON layer URLs
  urbanGeojsonUrl?: string;
  roadsGeojsonUrl?: string;
  waterGeojsonUrl?: string;
  buildingsGeojsonUrl?: string;
  greenAreasGeojsonUrl?: string;
  poisGeojsonUrl?: string;
  
  // Additional files
  renderedImageUrl?: string;
  pdfExportUrl?: string;
  pictosFolderUrl?: string;
  logosFolderUrl?: string;
  
  // Legacy fields
  dataFileUrl?: string;
  styleFileUrl?: string;
  legendFileUrl?: string;
  imageFileUrl?: string;
  
  // Additional metadata
  geojsonLayers?: object;
  
  isPublished?: boolean;
  userId?: number;
}

// File upload types
export interface FileUploadRequest {
  mapId: string;
  fileType: 'data' | 'style' | 'legend' | 'image' | 
            'urban' | 'roads' | 'water' | 'buildings' | 
            'green' | 'pois' | 'rendered' | 'pdf' | 
            'pictos' | 'logos';
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