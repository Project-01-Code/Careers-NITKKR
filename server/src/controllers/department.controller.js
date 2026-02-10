import { Department } from '../models/department.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({ isActive: true })
        .select('name code')
        .sort({ name: 1 });

    res
        .status(200)
        .json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});
