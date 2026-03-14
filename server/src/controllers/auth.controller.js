import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IS_DEV = process.env.NODE_ENV === 'development';

/** Max concurrent device sessions per user (env-configurable). */
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS, 10) || 5;

/** @type {import('express').CookieOptions} */
const cookieOptions = {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: 'strict',
};

/** Mongoose projection that strips sensitive fields from user documents. */
const USER_PUBLIC_FIELDS = '-password -sessions -deletedAt';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates a numeric OTP and persists it to a VerificationToken document.
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

  let tokenDoc = await VerificationToken.findOne({ email, type });

  if (tokenDoc) {
    tokenDoc.otp = otp;
    tokenDoc.expiresAt = expiresAt;
  } else {
    tokenDoc = new VerificationToken({ email, type, otp, expiresAt });
  }

  await tokenDoc.save();
  return otp;
};

/**
 * Validates an OTP for a given user and token type.
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
 * Generates a new access + refresh token pair and adds a session entry to the user.
 * Enforces MAX_SESSIONS cap by evicting the oldest session when full.
 *
 * @param {string} userId
 * @param {string} [deviceInfo]  - User-Agent string from the request
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
const generateTokensAndAddSession = async (userId, deviceInfo = '') => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Hash the refresh token before storing
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    const expiresAt = new Date(
      Date.now() + parseExpiry(refreshExpiry)
    );

    // Evict oldest sessions if at capacity
    if (user.sessions.length >= MAX_SESSIONS) {
      user.sessions.sort((a, b) => a.createdAt - b.createdAt);
      user.sessions.splice(0, user.sessions.length - MAX_SESSIONS + 1);
    }

    user.sessions.push({ token: tokenHash, deviceInfo, createdAt: new Date(), expiresAt });
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while generating tokens.'
    );
  }
};

/**
 * Convert an expiry string like "7d", "15m", "1h" into milliseconds.
 */
function parseExpiry(expiry) {
  const num = parseInt(expiry, 10);
  if (expiry.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  if (expiry.endsWith('h')) return num * 60 * 60 * 1000;
  if (expiry.endsWith('m')) return num * 60 * 1000;
  if (expiry.endsWith('s')) return num * 1000;
  return num; // assume ms
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

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
 * Issues an access/refresh token pair and opens a new device session.
 * Existing sessions on other devices remain active.
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'] || '';

  const user = await User.findOne({ email, deletedAt: null });

  if (!user || !(await user.isPasswordCorrect(password))) {
    if (IS_DEV) {
      console.log(`[Login Debug] Failure for ${email}. User found: ${!!user}`);
    }
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

  const { accessToken, refreshToken } = await generateTokensAndAddSession(
    user._id,
    deviceInfo
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
 * Removes only the session matching the current device's refresh token.
 * Other device sessions remain active.
 */
const logoutUser = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;

  if (incomingToken) {
    const user = await User.findById(req.user._id);
    if (user) {
      // Remove the session whose token hash matches this device's token
      const filtered = [];
      for (const session of user.sessions) {
        const matches = await bcrypt.compare(incomingToken, session.token);
        if (!matches) filtered.push(session);
      }
      user.sessions = filtered;
      await user.save({ validateBeforeSave: false });
    }
  }

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
 * DELETE /auth/sessions
 *
 * Logs out from ALL devices by clearing the entire sessions array.
 */
const logoutAllDevices = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { sessions: [] } },
    { new: true }
  );

  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.LOGOUT,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: req.user._id,
    changes: { reason: 'Logout all devices' },
    req,
  });

  return res
    .status(HTTP_STATUS.OK)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {},
        'Logged out from all devices successfully.'
      )
    );
});

/**
 * POST /auth/refresh-token
 *
 * Validates the incoming refresh token against all active sessions,
 * then rotates only the matching session's token (Token Rotation).
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

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

    // Find the matching session by comparing hashes
    let matchedIndex = -1;
    for (let i = 0; i < user.sessions.length; i++) {
      const session = user.sessions[i];
      // Skip expired sessions
      if (session.expiresAt < new Date()) continue;
      const matches = await bcrypt.compare(incomingRefreshToken, session.token);
      if (matches) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Refresh token is expired or already used.'
      );
    }

    // Rotate — generate new token pair and replace the matched session's token hash
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);

    const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    user.sessions[matchedIndex].token = newTokenHash;
    user.sessions[matchedIndex].expiresAt = new Date(Date.now() + parseExpiry(refreshExpiry));

    await user.save({ validateBeforeSave: false });

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

// ---------------------------------------------------------------------------
// Profile Handlers
// ---------------------------------------------------------------------------

/**
 * GET /auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, req.user, 'Profile fetched successfully.')
    );
});

/**
 * POST /auth/sessions — list all active sessions for the current user
 */
const getActiveSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const now = new Date();

  // Return only non-expired sessions, without the token hash
  const sessions = (user.sessions || [])
    .filter((s) => s.expiresAt > now)
    .map((s) => ({
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, { sessions, count: sessions.length }, 'Active sessions fetched.')
    );
});

/**
 * PATCH /auth/profile
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

// ---------------------------------------------------------------------------
// Registration & Password Handlers
// ---------------------------------------------------------------------------

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  const existedUser = await User.findOne({ email, deletedAt: null });
  if (existedUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists.'
    );
  }

  const tokenDoc = await validateOTP(
    email,
    TOKEN_TYPES.EMAIL_VERIFICATION,
    otp
  );

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
 */
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid request.');
  }

  const tokenDoc = await validateOTP(email, TOKEN_TYPES.PASSWORD_RESET, otp);

  user.password = newPassword;
  // Invalidate all sessions on password reset for security
  user.sessions = [];
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
  logoutAllDevices,
  refreshAccessToken,
  getProfile,
  getActiveSessions,
  updateProfile,
  sendPasswordResetOTPHandler,
  resetPasswordHandler,
};
