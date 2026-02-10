import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logAction } from '../utils/auditLogger.js';
import {
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  USER_ROLES,
  HTTP_STATUS,
} from '../constants.js';
import jwt from 'jsonwebtoken';

// Cookie options for secure token storage
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Only secure in production
  sameSite: 'strict', // CSRF protection
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while generating refresh and access token'
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existedUser = await User.findOne({ email, deletedAt: null });

  if (existedUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists'
    );
  }

  // Create user with applicant role (public registration)
  const user = await User.create({
    email,
    password,
    role: USER_ROLES.APPLICANT, // Force applicant role for public registration
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken -deletedAt'
  );

  if (!createdUser) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while registering the user'
    );
  }

  // Audit log
  await logAction({
    userId: createdUser._id,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: createdUser._id,
    changes: {
      after: {
        email: createdUser.email,
        role: createdUser.role,
      },
    },
    req,
  });

  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        createdUser,
        'User registered Successfully'
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email, deletedAt: null });

  if (!user) {
    // Audit failed login attempt
    await logAction({
      userId: null,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: null,
      changes: {
        before: { email },
      },
      req,
    });

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    // Audit failed login attempt
    await logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: user._id,
      changes: {
        before: { email },
      },
      req,
    });

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken -deletedAt'
  );

  // Audit successful login
  await logAction({
    userId: user._id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: user._id,
    changes: {},
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged In Successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // removes the field from document
      },
    },
    {
      new: true,
    }
  );

  // Audit logout
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.LOGOUT,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: req.user._id,
    changes: {},
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(HTTP_STATUS.OK, {}, 'User logged Out'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token required');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findOne({
      _id: decodedToken?._id,
      deletedAt: null,
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Refresh token is expired or used'
      );
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(HTTP_STATUS.OK)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed'
        )
      );
  } catch (error) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      error?.message || 'Invalid refresh token'
    );
  }
});

const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, req.user, 'Profile fetched successfully')
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const { profile } = req.body;

  const currentUser = await User.findById(req.user._id);

  const oldProfile = { ...currentUser.profile.toObject() };

  Object.assign(currentUser.profile, profile);

  await currentUser.save();

  const updatedUser = await User.findById(req.user._id).select(
    '-password -refreshToken -deletedAt'
  );

  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: req.user._id,
    changes: {
      before: { profile: oldProfile },
      after: { profile: updatedUser.profile },
    },
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updatedUser,
        'Profile updated successfully'
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
};
