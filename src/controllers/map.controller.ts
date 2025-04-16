import { Request, Response, NextFunction } from 'express';
import Map from '../models/map.model';
import { generatePresignedUploadUrl, generatePresignedGetUrl } from '../config/s3';
import { ApiError } from '../middlewares/error.middleware';
import { FileUploadRequest, MapUpdateDTO } from '../types';
import { s3, bucketName } from '../config/s3';
import { Op } from 'sequelize';

export class MapController {
  /**
   * Create a new map
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { title, description, isPublished = false } = req.body;
      const userId = req.user.id;

      // Create the map
      const map = await Map.create({
        title,
        description,
        isPublished,
        userId,
      });

      res.status(201).json({ map });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a map by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const map = await Map.findByPk(Number(id));

      if (!map) {
        throw new ApiError(404, 'Map not found');
      }

      res.status(200).json({ map });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a map by slug
   */
  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const map = await Map.findOne({ where: { slug } });

      if (!map) {
        throw new ApiError(404, 'Map not found');
      }

      // Only return published maps to non-authenticated users or users who don't own the map
      if (!map.isPublished && (!req.user || req.user.id !== map.userId)) {
        throw new ApiError(404, 'Map not found');
      }

      res.status(200).json({ map });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all maps
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, published } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      // Prepare query conditions
      const whereConditions: any = {};
      
      // Filter by published status if provided
      if (published !== undefined) {
        whereConditions.isPublished = published === 'true' || published === '1';
      }
      
      // Get maps with pagination
      const { count, rows: maps } = await Map.findAndCountAll({
        where: whereConditions,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        maps,
        meta: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get maps by user
   */
  static async getByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Get maps for the user with pagination
      const { count, rows: maps } = await Map.findAndCountAll({
        where: { userId },
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        maps,
        meta: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a map
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const userId = req.user.id;
      const mapData = req.body;

      // Check if the map exists
      const map = await Map.findByPk(Number(id));
      if (!map) {
        throw new ApiError(404, 'Map not found');
      }

      // Check if the user owns the map
      if (map.userId !== userId) {
        throw new ApiError(403, 'Unauthorized access to map');
      }

      // Update the map
      await map.update(mapData);
      await map.reload();

      res.status(200).json({ map });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a map
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Check if the map exists
      const map = await Map.findByPk(Number(id));
      if (!map) {
        throw new ApiError(404, 'Map not found');
      }

      // Check if the user owns the map
      if (map.userId !== userId) {
        throw new ApiError(403, 'Unauthorized access to map');
      }

      // Delete the map
      await map.destroy();

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a pre-signed URL for file upload
   */
  static async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      
      const { mapSlug, fileType, extension } = req.body;
      
      if (!mapSlug || !fileType || !extension) {
        throw new ApiError(400, 'Missing required fields');
      }
      
      // Validate file type
      const allowedFileTypes = ['data', 'style', 'legend', 'image'];
      if (!allowedFileTypes.includes(fileType)) {
        throw new ApiError(400, 'Invalid file type');
      }
      
      // Validate extension based on file type
      const validExtensions: Record<string, string[]> = {
        data: ['geojson'],
        style: ['json'],
        legend: ['json'],
        image: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      };
      
      if (!validExtensions[fileType].includes(extension.toLowerCase())) {
        throw new ApiError(400, `Invalid extension for ${fileType}`);
      }
      
      // Generate the S3 key
      let s3Key = `cartes/${mapSlug}/${fileType}`;
      if (fileType === 'data') {
        s3Key += '.geojson';
      } else if (fileType === 'style' || fileType === 'legend') {
        s3Key += '.json';
      } else {
        s3Key += `.${extension}`;
      }
      
      // Generate a pre-signed URL
      const signedUrl = await generatePresignedUploadUrl(s3Key, 'application/octet-stream', 600); // 10 minutes
      
      res.status(200).json({
        url: signedUrl,
        key: s3Key,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update file URL in map record
   */
  static async updateFileUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.id;
      const { id } = req.params;
      const mapId = Number(id);
      const { fileType, s3Key } = req.body;
      
      if (!fileType || !s3Key) {
        throw new ApiError(400, 'Missing required fields');
      }
      
      // Verify map ownership
      const map = await Map.findByPk(mapId);
      
      if (!map) {
        throw new ApiError(404, 'Map not found');
      }
      
      if (map.userId !== userId) {
        throw new ApiError(403, 'Not authorized to update this map');
      }
      
      // Determine which field to update based on file type
      const updateData: Partial<MapUpdateDTO> = {};
      
      switch (fileType) {
        case 'data':
          updateData.dataFileUrl = s3Key;
          break;
        case 'style':
          updateData.styleFileUrl = s3Key;
          break;
        case 'legend':
          updateData.legendFileUrl = s3Key;
          break;
        case 'image':
          updateData.imageFileUrl = s3Key;
          break;
        default:
          throw new ApiError(400, 'Invalid file type');
      }
      
      // Update the map with the file URL
      const updatedMap = await map.update(updateData);
      
      if (!updatedMap) {
        throw new ApiError(500, 'Failed to update file URL');
      }
      
      res.status(200).json({ map: updatedMap });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Récupère un fichier cartographique depuis S3
   */
  static async getMapFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug, fileType } = req.params;
      
      // Vérifier que la carte existe et est publiée (pour les utilisateurs non authentifiés)
      const map = await Map.findOne({ where: { slug } });
      
      if (!map) {
        throw new ApiError(404, 'Carte non trouvée');
      }
      
      // Vérifier que l'utilisateur a accès à cette carte
      if (!map.isPublished && (!req.user || req.user.id !== map.userId)) {
        throw new ApiError(403, 'Accès non autorisé');
      }
      
      // Déterminer le chemin S3 du fichier
      let s3Key = `cartes/${slug}/${fileType}`;
      switch (fileType) {
        case 'data':
          s3Key += '.geojson';
          break;
        case 'style':
        case 'legend':
          s3Key += '.json';
          break;
        case 'image':
          // Extraire l'extension du chemin stocké
          const imageUrl = map.imageFileUrl;
          const extension = imageUrl.substring(imageUrl.lastIndexOf('.'));
          s3Key += extension;
          break;
        default:
          throw new ApiError(400, 'Type de fichier invalide');
      }
      
      // Option 1: Renvoyer une URL présignée à courte durée
      const url = await generatePresignedGetUrl(s3Key, 300); // 5 minutes
      res.json({ url });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Get file extension based on file type and content type
 */
function getFileExtension(fileType: string, contentType: string): string {
  if (fileType === 'data') return '.geojson';
  if (fileType === 'style') return '.json';
  if (fileType === 'legend') return '.json';
  
  // For images, determine extension from content type
  if (fileType === 'image') {
    switch (contentType) {
      case 'image/png': return '.png';
      case 'image/jpeg': return '.jpg';
      case 'image/svg+xml': return '.svg';
      default: return '.png';
    }
  }
  
  return '';
} 