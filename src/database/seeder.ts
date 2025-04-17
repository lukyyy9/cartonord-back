import { sequelize, initializeDatabase } from '../config/database';
import User from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  try {
    // Initialize database and sync models
    await initializeDatabase(true); // true to force sync and recreate tables

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@cartonord.com',
      password: 'admin123',
      isAdmin: true,
    });

    console.log('Admin user created successfully:', adminUser.toJSON());
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seed;
