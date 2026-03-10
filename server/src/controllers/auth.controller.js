import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { VerificationToken } from '../models/verificationToken.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logAction } from '../utils/auditLogger.js';
import {
  sendVerificationOTP,
  sendPasswordResetOTP,
} from '../services/email.service.js';
import {
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  USER_ROLES,
  HTTP_STATUS,
  OTP_CONFIG,
  TOKEN_TYPES,
} from '../constants.js';

// Constants

const IS_DEV = process.env.NODE_ENV === 'development';

/** @type {import('express').CookieOptions} */
const cookieOptions = {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: 'strict',
};

/** Mongoose projection that strips sensitive fields from user documents. */
const USER_PUBLIC_FIELDS = '-password -refreshToken -deletedAt';

// Helpers

/**
 * Generates a numeric OTP and persists it to a VerificationToken document
 * (one active OTP per user per type). Hashing is handled transparently by
 * the model's pre-save hook — the controller never touches bcrypt.
 *
 * Uses a find-then-save pattern (instead of findOneAndUpdate) so that
 * Mongoose pre-save hooks fire correctly.
 *
 * @param {string} email - The user's email address.
 * @param {string} type   - Token type constant from TOKEN_TYPES.
 * @returns {Promise<string>} The plaintext OTP (for emailing / dev response).
 */
const createAndStoreOTP = async (email, type) => {
  const otp = String(
    Math.floor(
      10 ** (OTP_CONFIG.LENGTH - 1) +
      Math.random() * 9 * 10 ** (OTP_CONFIG.LENGTH - 1)
    )
  );

  const expiresAt = new Date(
    Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
  );

  // Find existing doc or build a new one, then save so the pre-save hook runs.
  let tokenDoc = await VerificationToken.findOne({ email, type });

  if (tokenDoc) {
    tokenDoc.otp = otp; // plain - hook will hash on save
    tokenDoc.expiresAt = expiresAt;
  } else {
    tokenDoc = new VerificationToken({ email, type, otp, expiresAt });
  }

  await tokenDoc.save();

  return otp;
};

/**
 * Validates an OTP for a given user and token type.
 *
 * Performs explicit expiry check in addition to the TTL index (MongoDB's TTL
 * janitor runs with up to ~60 s lag, so stale documents can linger).
 *
 * @param {string} email - The user's email address.
 * @param {string} type   - Token type constant from TOKEN_TYPES.
 * @param {string} otp    - The plaintext OTP submitted by the user.
 * @returns {Promise<import('../models/verificationToken.model.js').VerificationTokenDoc>}
 * @throws {ApiError} On missing, expired, or incorrect OTP.
 */
const validateOTP = async (email, type, otp) => {
  const tokenDoc = await VerificationToken.findOne({ email, type });

  if (!tokenDoc) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP not found or has expired. Please request a new one.'
    );
  }

  if (tokenDoc.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: tokenDoc._id });
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP has expired. Please request a new one.'
    );
  }

  const isValid = await tokenDoc.verifyOTP(otp);

  if (!isValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP.');
  }

  return tokenDoc;
};

/**
 * Generates an access/refresh token pair, persists the refresh token to the
 * user document, and returns both tokens.
 *
 * @param {string} userId - The user's MongoDB ObjectId.
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 * @throws {ApiError} On any internal failure during token generation.
 */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while generating tokens.'
    );
  }
};

const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existedUser = await User.findOne({ email, deletedAt: null });
  if (existedUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists.'
    );
  }

  const otp = await createAndStoreOTP(email, TOKEN_TYPES.EMAIL_VERIFICATION);
  sendVerificationOTP(email, otp).catch(() => { });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        IS_DEV ? { otp } : {},
        'OTP sent successfully.'
      )
    );
});

/**
 * POST /auth/login
 *
 * Validates credentials and issues an access/refresh token pair via both
 * cookies and the response body (supports cookie-less clients).
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, deletedAt: null });

  if (!user || !(await user.isPasswordCorrect(password))) {
    await logAction({
      userId: user?._id ?? null,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: user?._id ?? null,
      changes: { before: { email } },
      req,
    });
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials.');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(USER_PUBLIC_FIELDS);

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
        HTTP_STATUS.OK,
        { user: loggedInUser, accessToken, refreshToken },
        'Logged in successfully.'
      )
    );
});

/**
 * DELETE /auth/logout
 *
 * Clears the stored refresh token and removes auth cookies.
 */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

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
    .json(new ApiResponse(HTTP_STATUS.OK, {}, 'Logged out successfully.'));
});

/**
 * POST /auth/refresh-token
 *
 * Validates the incoming refresh token (from cookie or body), rotates both
 * tokens, and issues a fresh pair.
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token required.');
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findOne({ _id: decoded?._id, deletedAt: null });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token.');
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Refresh token is expired or already used.'
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
          { accessToken },
          'Access token refreshed.'
        )
      );
  } catch (error) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      error?.message || 'Invalid refresh token.'
    );
  }
});

// Profile Handlers

/**
 * GET /auth/profile
 *
 * Returns the authenticated user's public profile (attached by verifyJWT).
 */
const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, req.user, 'Profile fetched successfully.')
    );
});

/**
 * PATCH /auth/profile
 *
 * Merges validated body fields onto the user's profile sub-document and
 * persists the update.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const oldProfile = { ...currentUser.profile.toObject() };

  Object.assign(currentUser.profile, req.body);
  await currentUser.save();

  const updatedUser = await User.findById(req.user._id).select(
    USER_PUBLIC_FIELDS
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
        'Profile updated successfully.'
      )
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  const existedUser = await User.findOne({ email, deletedAt: null });
  if (existedUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists.'
    );
  }

  // Validate OTP first
  const tokenDoc = await validateOTP(
    email,
    TOKEN_TYPES.EMAIL_VERIFICATION,
    otp
  );

  // OTP is valid, create the user
  const user = await User.create({
    email,
    password,
    role: USER_ROLES.APPLICANT,
    profile: {},
  });

  await VerificationToken.deleteOne({ _id: tokenDoc._id });

  const createdUser = await User.findById(user._id).select(USER_PUBLIC_FIELDS);

  if (!createdUser) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while registering the user.'
    );
  }

  await logAction({
    userId: createdUser._id,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: createdUser._id,
    changes: { after: { email: createdUser.email, role: createdUser.role } },
    req,
  });

  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        createdUser,
        'Account created successfully.'
      )
    );
});

/**
 * POST /auth/reset-password/send
 *
 * Public endpoint. Always responds 200 regardless of whether the email exists
 * to prevent account enumeration. Returns the OTP in development mode only.
 */
const sendPasswordResetOTPHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email, deletedAt: null });

  if (!user) {
    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          {},
          'If an account exists, a reset OTP has been sent.'
        )
      );
  }

  const otp = await createAndStoreOTP(email, TOKEN_TYPES.PASSWORD_RESET);
  sendPasswordResetOTP(email, otp).catch(() => { });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        IS_DEV ? { otp } : {},
        'If an account exists, a reset OTP has been sent.'
      )
    );
});

/**
 * POST /auth/reset-password/confirm
 *
 * Public endpoint. Validates the OTP then replaces the user's password.
 * The User model's pre-save hook handles bcrypt hashing.
 */
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid request.');
  }

  const tokenDoc = await validateOTP(email, TOKEN_TYPES.PASSWORD_RESET, otp);

  user.password = newPassword; // pre-save hook handles hashing
  await user.save({ validateBeforeSave: false });

  await VerificationToken.deleteOne({ _id: tokenDoc._id });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, {}, 'Password reset successfully.'));
});

export {
  sendRegistrationOTP,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
  sendPasswordResetOTPHandler,
  resetPasswordHandler,
};
