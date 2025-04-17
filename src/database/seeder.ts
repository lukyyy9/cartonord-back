import { sequelize, initializeDatabase } from '../config/database';
import User from '../models/user.model';

const seed = async () => {
  try {
    // Initialize database and sync models
    await initializeDatabase();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@cartonord.com' } });
    if (!existingAdmin) {
      // Create admin user only if it doesn't exist
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@cartonord.com',
        password: 'admin123',
        isAdmin: true,
      });
      console.log('Admin user created successfully:', adminUser.toJSON());
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
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
