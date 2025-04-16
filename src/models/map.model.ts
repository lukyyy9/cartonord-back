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