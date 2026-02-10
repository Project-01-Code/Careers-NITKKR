import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department } from '../models/department.model.js';
import { DB_NAME } from '../constants.js';

dotenv.config({
    path: './.env',
});

const departments = [
    { name: 'Computer Engineering', code: 'CO' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics and Communication Engineering', code: 'EC' },
    { name: 'Electrical Engineering', code: 'EE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Production and Industrial Engineering', code: 'PI' },
    { name: 'Physics', code: 'PH' },
    { name: 'Chemistry', code: 'CH' },
    { name: 'Mathematics', code: 'MA' },
    { name: 'Humanities and Social Sciences', code: 'HS' },
    { name: 'Business Administration', code: 'BA' },
    { name: 'Computer Applications', code: 'CA' },
];

const seedDepartments = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('Connected to MongoDB');
        for (const dept of departments) {
            const exists = await Department.findOne({ code: dept.code });
            if (!exists) {
                await Department.create(dept);
                console.log(`Created department: ${dept.name}`);
            } else {
                console.log(`Department already exists: ${dept.name}`);
            }
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding departments:', error);
        process.exit(1);
    }
};

seedDepartments();
