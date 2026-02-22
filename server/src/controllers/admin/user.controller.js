import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS, USER_ROLES, AUDIT_ACTIONS } from '../../constants.js';
import { logAction } from '../../utils/auditLogger.js';

/**
 * @desc    Create a new user (Admin/Reviewer)
 * @route   POST /api/v1/admin/users
 * @access  Super Admin (for Admin creation) / Admin (for Reviewer creation)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, role, department } = req.body;

  // 1. Validate Target Role
  if (![USER_ROLES.ADMIN, USER_ROLES.REVIEWER].includes(role)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid role specified');
  }

  // 2. Hierarchy Check
  const currentUserRole = req.user.role;

  // Only Super Admin can create Admins
  if (role === USER_ROLES.ADMIN && currentUserRole !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Only Super Admins can create new Admins'
    );
  }

  // Reviewers can be created by Admins or Super Admins
  // (Implicitly allowed if we reach here, assuming route protection handles basic role check)

  // 3. Check Persistence
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists'
    );
  }

  // 4. Create User
  const user = await User.create({
    email,
    password,
    role,
    profile: {
      fullName,
      department,
    },
  });

  // 5. Audit Log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    resourceType: 'User',
    resourceId: user._id,
    changes: { role, createdBy: req.user.email },
    req,
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        createdUser,
        `${role} created successfully`
      )
    );
});

/**
 * @desc    Promote an existing user to Admin
 * @route   PATCH /api/v1/admin/users/:userId/promote
 * @access  Super Admin only
 */
export const promoteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot modify Super Admin');
  }

  if (user.role === USER_ROLES.ADMIN) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User is already an Admin');
  }

  const oldRole = user.role;
  user.role = USER_ROLES.ADMIN;
  await user.save({ validateBeforeSave: false });

  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    resourceType: 'User',
    resourceId: user._id,
    changes: { oldRole, newRole: USER_ROLES.ADMIN, promotedBy: req.user.email },
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { _id: user._id, email: user.email, role: user.role },
        'User promoted to Admin successfully'
      )
    );
});
