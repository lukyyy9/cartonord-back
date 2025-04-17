import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeCreate } from 'sequelize-typescript';
import User from './user.model';
import slugify from '../utils/slugify';

@Table({
  tableName: 'maps',
  timestamps: true,
  underscored: true,
})
export class Map extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  slug!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  location?: string;

  // Base GeoJSON files
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'urban_geojson_url'
  })
  urbanGeojsonUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'roads_geojson_url'
  })
  roadsGeojsonUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'water_geojson_url'
  })
  waterGeojsonUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'buildings_geojson_url'
  })
  buildingsGeojsonUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'green_areas_geojson_url'
  })
  greenAreasGeojsonUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'pois_geojson_url'
  })
  poisGeojsonUrl?: string;

  // Additional files
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'rendered_image_url'
  })
  renderedImageUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'pdf_export_url'
  })
  pdfExportUrl?: string;

  // Pictos and logos
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'pictos_folder_url'
  })
  pictosFolderUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'logos_folder_url'
  })
  logosFolderUrl?: string;

  // Keep existing fields for compatibility
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'data_file_url'
  })
  dataFileUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'style_file_url'
  })
  styleFileUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'legend_file_url'
  })
  legendFileUrl?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'image_file_url'
  })
  imageFileUrl?: string;

  // Additional metadata for client files
  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: 'geojson_layers'
  })
  geojsonLayers?: object;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_published'
  })
  isPublished!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id'
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'updated_at',
  })
  updatedAt!: Date;

  // Auto-generate slug before create if not provided
  @BeforeCreate
  static generateSlug(instance: Map) {
    if (!instance.slug) {
      instance.slug = slugify(instance.title);
    }
  }
}

export default Map; 