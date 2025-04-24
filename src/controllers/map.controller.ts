import { Request, Response, NextFunction } from 'express';
import Map from '../models/map.model';
import { generatePresignedUploadUrl, generatePresignedGetUrl } from '../config/s3';
import { ApiError } from '../middlewares/error.middleware';
import { FileUploadRequest, MapUpdateDTO } from '../types';
import { s3, bucketName } from '../config/s3';
import { Op } from 'sequelize';
import { promises as fs } from 'fs';
import path from 'path';

export class MapController {
  /**
   * Create a new map
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { 
        title, 
        description, 
        location,
        slug,
        isPublished = false,
        urbanGeojsonUrl,
        roadsGeojsonUrl,
        waterGeojsonUrl,
        buildingsGeojsonUrl,
        greenAreasGeojsonUrl,
        poisGeojsonUrl,
        renderedImageUrl,
        pdfExportUrl,
        pictosFolderUrl,
        logosFolderUrl,
        dataFileUrl,
        styleFileUrl,
        legendFileUrl,
        imageFileUrl,
        geojsonLayers
      } = req.body;
      
      const userId = req.user.id;

      // Create the map
      const map = await Map.create({
        title,
        slug,
        description,
        location,
        isPublished,
        urbanGeojsonUrl,
        roadsGeojsonUrl,
        waterGeojsonUrl,
        buildingsGeojsonUrl,
        greenAreasGeojsonUrl,
        poisGeojsonUrl,
        renderedImageUrl,
        pdfExportUrl,
        pictosFolderUrl,
        logosFolderUrl,
        dataFileUrl,
        styleFileUrl,
        legendFileUrl,
        imageFileUrl,
        geojsonLayers,
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
   * Save GeoJSON layers for a map
   */
  static async saveGeojsonLayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const userId = req.user.id;
      const { layers } = req.body;

      // Check if the map exists
      const map = await Map.findByPk(Number(id));
      if (!map) {
        throw new ApiError(404, 'Map not found');
      }

      // Check if the user owns the map
      if (map.userId !== userId) {
        throw new ApiError(403, 'Unauthorized access to map');
      }

      // Update the map's GeoJSON layers
      await map.update({ 
        geojsonLayers: layers 
      });

      res.status(200).json({ 
        success: true,
        message: 'GeoJSON layers saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pictograms list
   */
  static async getPictograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // List of pictogram categories with their icons
      // In a real implementation, this would come from a database or storage
      const pictograms = [
        {
          id: 'picto-1',
          name: 'Restaurant',
          url: '/pictos/restaurant.png',
          category: 'Services'
        },
        {
          id: 'picto-2',
          name: 'Hôtel',
          url: '/pictos/hotel.png',
          category: 'Services'
        },
        {
          id: 'picto-3',
          name: 'Parking',
          url: '/pictos/parking.png',
          category: 'Transport'
        },
        {
          id: 'picto-4',
          name: 'Musée',
          url: '/pictos/museum.png',
          category: 'Culture'
        },
        {
          id: 'picto-5',
          name: 'Plage',
          url: '/pictos/beach.png',
          category: 'Loisirs'
        },
        {
          id: 'picto-6',
          name: 'Parc',
          url: '/pictos/park.png',
          category: 'Loisirs'
        },
        {
          id: 'picto-7',
          name: 'École',
          url: '/pictos/school.png',
          category: 'Éducation'
        },
        {
          id: 'picto-8',
          name: 'Hôpital',
          url: '/pictos/hospital.png',
          category: 'Santé'
        },
        {
          id: 'picto-9',
          name: 'Gare',
          url: '/pictos/train-station.png',
          category: 'Transport'
        }
      ];

      res.status(200).json(pictograms);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a new pictogram
   */
  static async uploadPictogram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { name, category } = req.body;
      
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      // Generate a unique key for the pictogram in S3
      const fileKey = `pictograms/${req.user.id}/${Date.now()}-${req.file.originalname}`;
      
      // Upload the file to S3
      await s3.putObject({
        Bucket: bucketName,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      // Generate a URL for the uploaded pictogram
      const pictoUrl = await generatePresignedGetUrl(fileKey);

      res.status(201).json({
        id: `picto-${Date.now()}`,
        name,
        url: pictoUrl,
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a GeoJSON file for a map and save it to disk
   */
  static async uploadGeojson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      const mapId = Number(req.params.mapId);
      const mapRec = await Map.findByPk(mapId);
      if (!mapRec) {
        throw new ApiError(404, 'Map not found');
      }
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }
      // Prepare upload directory
      const uploadDir = path.resolve(__dirname, '../../uploads', `map_${mapId}`, 'geojson');
      await fs.mkdir(uploadDir, { recursive: true });
      // Sanitize filename and add timestamp
      const timestamp = Date.now();
      const safeName = req.file.originalname.replace(/\W/g, '_');
      const fileName = `${timestamp}_${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      // Write file to disk
      await fs.writeFile(filePath, req.file.buffer);
      res.status(201).json({ message: 'GeoJSON uploaded', fileName, filePath });
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
      
      // Handle both query param and body formats for flexibility
      const folder = req.query.folder as string || req.body.folder;
      const filename = req.query.filename as string || req.body.filename;
      
      if (!folder || !filename) {
        throw new ApiError(400, 'Missing required fields: folder and filename');
      }
      
      // Extract file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      if (!extension) {
        throw new ApiError(400, 'Invalid filename format');
      }
      
      // Determine content type based on extension
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'geojson': 'application/json',
        'json': 'application/json',
      };
      
      const contentType = contentTypeMap[extension] || 'application/octet-stream';
      
      // Generate the S3 key
      const s3Key = `${folder}/${filename}`;
      
      // Generate a pre-signed URL
      const signedUrl = await generatePresignedUploadUrl(s3Key, contentType, 600); // 10 minutes
      
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
      
      // Support both legacy and new file types
      switch (fileType) {
        // Legacy file types
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
          
        // New file types
        case 'urban':
          updateData.urbanGeojsonUrl = s3Key;
          break;
        case 'roads':
          updateData.roadsGeojsonUrl = s3Key;
          break;
        case 'water':
          updateData.waterGeojsonUrl = s3Key;
          break;
        case 'buildings':
          updateData.buildingsGeojsonUrl = s3Key;
          break;
        case 'green':
          updateData.greenAreasGeojsonUrl = s3Key;
          break;
        case 'pois':
          updateData.poisGeojsonUrl = s3Key;
          break;
        case 'rendered':
          updateData.renderedImageUrl = s3Key;
          break;
        case 'pdf':
          updateData.pdfExportUrl = s3Key;
          break;
        case 'pictos':
          updateData.pictosFolderUrl = s3Key;
          break;
        case 'logos':
          updateData.logosFolderUrl = s3Key;
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
      
      // Determine the S3 key based on the file type
      let s3Key = '';
      
      // Handle both legacy and new file types
      switch (fileType) {
        // Legacy file types
        case 'data':
          s3Key = map.dataFileUrl || '';
          break;
        case 'style':
          s3Key = map.styleFileUrl || '';
          break;
        case 'legend':
          s3Key = map.legendFileUrl || '';
          break;
        case 'image':
          s3Key = map.imageFileUrl || '';
          break;
          
        // New file types
        case 'urban':
          s3Key = map.urbanGeojsonUrl || '';
          break;
        case 'roads':
          s3Key = map.roadsGeojsonUrl || '';
          break;
        case 'water':
          s3Key = map.waterGeojsonUrl || '';
          break;
        case 'buildings':
          s3Key = map.buildingsGeojsonUrl || '';
          break;
        case 'green':
          s3Key = map.greenAreasGeojsonUrl || '';
          break;
        case 'pois':
          s3Key = map.poisGeojsonUrl || '';
          break;
        case 'rendered':
          s3Key = map.renderedImageUrl || '';
          break;
        case 'pdf':
          s3Key = map.pdfExportUrl || '';
          break;
        default:
          throw new ApiError(400, 'Type de fichier invalide');
      }
      
      if (!s3Key) {
        throw new ApiError(404, 'Fichier non trouvé');
      }
      
      // Generate a pre-signed URL for the file
      const url = await generatePresignedGetUrl(s3Key, 300); // 5 minutes
      res.json({ url });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      
      // Count total maps
      const totalMaps = await Map.count();
      
      // Count total views (placeholder - you would need to implement a view counter)
      const totalViews = 0;
      
      // Calculate total number of GeoJSON layers
      let totalGeoJsonLayers = 0;
      const maps = await Map.findAll();
      
      // Get the most recent map title
      let latestMapTitle = null;
      if (maps.length > 0) {
        latestMapTitle = maps[0].title;
      }
      
      // Count layers and pictograms (placeholder - in a real implementation, you would query S3)
      maps.forEach(map => {
        // Count filled GeoJSON URLs as layers
        if (map.urbanGeojsonUrl) totalGeoJsonLayers++;
        if (map.roadsGeojsonUrl) totalGeoJsonLayers++;
        if (map.waterGeojsonUrl) totalGeoJsonLayers++;
        if (map.buildingsGeojsonUrl) totalGeoJsonLayers++;
        if (map.greenAreasGeojsonUrl) totalGeoJsonLayers++;
        if (map.poisGeojsonUrl) totalGeoJsonLayers++;
        if (map.dataFileUrl) totalGeoJsonLayers++;
      });
      
      // Placeholder for pictogram counts
      const totalPictograms = 0;
      const totalLogos = 0;
      
      // Placeholder for storage stats
      const storageUsed = '0 MB';
      const storageBreakdown = {
        geojsonStorage: '0 MB',
        imageStorage: '0 MB',
        pictoStorage: '0 MB',
        otherStorage: '0 MB'
      };
      
      res.status(200).json({
        totalMaps,
        totalViews,
        storageUsed,
        totalGeoJsonLayers,
        totalPictograms,
        totalLogos,
        latestMapTitle,
        storageBreakdown
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all maps for admin
   */
  static async getAdminMaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Get all maps with pagination
      const { count, rows: maps } = await Map.findAndCountAll({
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
   * Upload multiple files in batch
   */
  static async batchUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      
      const { mapId } = req.params;
      const { fileType } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new ApiError(400, 'No files provided');
      }
      
      if (!mapId) {
        throw new ApiError(400, 'Map ID is required');
      }
      
      // Verify map ownership
      const map = await Map.findByPk(Number(mapId));
      if (!map) {
        throw new ApiError(404, 'Map not found');
      }
      
      if (map.userId !== req.user.id) {
        throw new ApiError(403, 'Not authorized to update this map');
      }
      
      // Process each file
      const uploadPromises = files.map(async (file) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        if (!extension) {
          return { error: `Invalid filename format for ${file.originalname}` };
        }
        
        // Determine folder based on file type
        let folder: string;
        
        if (fileType === 'geojson') {
          folder = 'geojson';
        } else if (fileType === 'pictos') {
          folder = 'pictos';
        } else {
          return { error: `Invalid file type: ${fileType}` };
        }
        
        // Generate unique name if needed
        const fileName = `${Date.now()}-${file.originalname}`;
        
        // Generate the S3 key
        const s3Key = `${map.slug}/${folder}/${fileName}`;
        
        // Determine content type
        const contentTypeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'pdf': 'application/pdf',
          'geojson': 'application/json',
          'json': 'application/json',
        };
        
        const contentType = contentTypeMap[extension] || 'application/octet-stream';
        
        // Upload to S3
        const uploadParams = {
          Bucket: bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: contentType
        };
        
        try {
          await s3.upload(uploadParams).promise();
          
          // If successful, handle file type specific operations
          if (fileType === 'geojson') {
            // Store the GeoJSON URL in geojsonLayers field
            const currentLayers = map.geojsonLayers || {};
            await map.update({
              geojsonLayers: {
                ...currentLayers,
                [fileName]: s3Key
              }
            });
          } else if (fileType === 'pictos') {
            // Update the pictosFolderUrl if not set
            if (!map.pictosFolderUrl) {
              await map.update({ pictosFolderUrl: `${map.slug}/pictos` });
            }
          }
          
          return {
            originalName: file.originalname,
            s3Key,
            success: true
          };
        } catch (error) {
          console.error('S3 upload error:', error);
          return {
            originalName: file.originalname,
            error: 'Failed to upload file to S3',
            success: false
          };
        }
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Update the map record with the batch upload status
      await map.update({
        lastUpdated: new Date()
      });
      
      res.status(200).json({
        message: 'Batch upload processed',
        results,
        map
      });
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