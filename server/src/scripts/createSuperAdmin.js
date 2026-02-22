import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { DB_NAME, USER_ROLES } from '../constants.js';

dotenv.config({
  path: './.env',
});

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
    console.log(`✅ Connected to MongoDB: ${DB_NAME}`);

    const adminEmail = 'superadmin@nitkkr.ac.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'SuperAdmin@123';

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('User not found. Creating new Super Admin...');
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        role: USER_ROLES.SUPER_ADMIN,
        profile: {
          fullName: 'Super Administrator',
        },
      });
      console.log(`✅ Super Admin created successfully: ${adminEmail}`);
    } else {
      let needsSave = false;

      // Ensure Role
      if (admin.role !== USER_ROLES.SUPER_ADMIN) {
        admin.role = USER_ROLES.SUPER_ADMIN;
        needsSave = true;
      }

      // Ensure Password (Idempotent)
      const isPasswordSame = await admin.isPasswordCorrect(adminPassword);
      if (!isPasswordSame) {
        admin.password = adminPassword;
        needsSave = true;
      }

      // Ensure Active (Restore Soft Delete)
      if (admin.deletedAt) {
        admin.deletedAt = null;
        needsSave = true;
      }

      if (needsSave) {
        await admin.save();
        console.log(
          `✅ Super Admin updated: ${adminEmail} (Role/Password/Status ensured)`
        );
      } else {
        console.log(`✅ Super Admin is already up to date: ${adminEmail}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
