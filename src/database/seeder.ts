import bcrypt from 'bcrypt';
import User from '../models/user.model';

/**
 * Seed the database with initial data
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // Create admin user if it doesn't exist
    const adminEmail = 'admin@cartonord.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      // Hash password manually since we're bypassing the beforeCreate hook
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}; 