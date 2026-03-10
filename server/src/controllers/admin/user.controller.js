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
  const { email, password, firstName, lastName, role } = req.body;

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
      firstName: firstName || 'User',
      lastName: lastName || '',
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
  const { targetRole } = req.body;

  // 1. Validate Target Role
  if (!Object.values(USER_ROLES).includes(targetRole)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid role: ${targetRole}`);
  }

  // 2. Prevent Assigning Super Admin Role
  if (targetRole === USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Promotion to Super Admin is not allowed'
    );
  }

  // 3. Get User to Promote
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User to promote not found');
  }

  // 4. Hierarchy Checks
  const requesterRole = req.user.role;

  // Prevent modifying Super Admins
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Cannot modify roles of a Super Admin'
    );
  }

  // Block promotion to same role
  if (user.role === targetRole) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `User already has the role: ${targetRole}`
    );
  }

  /**
   * Hierarchy Enforcement:
   * - super_admin -> admin, reviewer
   * - admin       -> reviewer
   */
  if (requesterRole === USER_ROLES.ADMIN) {
    if (targetRole !== USER_ROLES.REVIEWER) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Admin can only promote users to Reviewer status'
      );
    }
  } else if (requesterRole !== USER_ROLES.SUPER_ADMIN) {
    // If we reach here and not super_admin (and rbac didn't catch it), reject
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Insufficient permissions to promote users'
    );
  }

  const oldRole = user.role;
  user.role = targetRole;
  await user.save({ validateBeforeSave: false });

  // 5. Audit Log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.ROLE_PROMOTED,
    resourceType: 'User',
    resourceId: user._id,
    changes: {
      oldRole,
      newRole: targetRole,
      promotedBy: req.user.email,
      requesterRole,
    },
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { _id: user._id, email: user.email, role: user.role },
        `User promoted from ${oldRole} to ${targetRole} successfully`
      )
    );
});

/**
 * @desc    Promote an existing user by email
 * @route   PATCH /api/v1/admin/users/promote-by-email
 * @access  Super Admin / Admin
 */
export const promoteUserByEmail = asyncHandler(async (req, res) => {
  const { email, targetRole } = req.body;

  if (!email || !targetRole) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Email and target role are required'
    );
  }

  // 1. Validate Target Role
  if (!Object.values(USER_ROLES).includes(targetRole)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid role: ${targetRole}`);
  }

  // 2. Prevent Assigning Super Admin Role
  if (targetRole === USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Promotion to Super Admin is not allowed'
    );
  }

  // 3. Get User to Promote
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User with this email not found');
  }

  // 4. Hierarchy Checks
  const requesterRole = req.user.role;

  // Prevent modifying Super Admins
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Cannot modify roles of a Super Admin'
    );
  }

  // Block promotion to same role
  if (user.role === targetRole) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `User already has the role: ${targetRole}`
    );
  }

  /**
   * Hierarchy Enforcement:
   * - super_admin -> admin, reviewer
   * - admin       -> reviewer
   */
  if (requesterRole === USER_ROLES.ADMIN) {
    if (targetRole !== USER_ROLES.REVIEWER) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Admin can only promote users to Reviewer status'
      );
    }
  } else if (requesterRole !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Insufficient permissions to promote users'
    );
  }

  const oldRole = user.role;
  user.role = targetRole;
  await user.save({ validateBeforeSave: false });

  // 5. Audit Log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.ROLE_PROMOTED,
    resourceType: 'User',
    resourceId: user._id,
    changes: {
      oldRole,
      newRole: targetRole,
      promotedBy: req.user.email,
      requesterRole,
      method: 'email',
    },
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { _id: user._id, email: user.email, role: user.role },
        `User ${email} promoted from ${oldRole} to ${targetRole} successfully`
      )
    );
});
