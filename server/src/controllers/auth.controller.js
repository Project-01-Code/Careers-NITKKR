import bcrypt from 'bcryptjs';
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

/* ─────────────────────────────── Constants ─────────────────────────────── */

const IS_DEV = process.env.NODE_ENV === 'development';

const cookieOptions = {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: 'strict',
};

const USER_PUBLIC_FIELDS = '-password -refreshToken -deletedAt';

/* ─────────────────────────────── Helpers ────────────────────────────────── */

/**
 * Generates a random numeric OTP, bcrypt-hashes it, and upserts the token
 * document (one active OTP per user per type).
 * Returns the plaintext OTP so it can be emailed / returned in dev mode.
 */
const createAndStoreOTP = async (userId, type) => {
  const otp = String(
    Math.floor(
      10 ** (OTP_CONFIG.LENGTH - 1) +
      Math.random() * 9 * 10 ** (OTP_CONFIG.LENGTH - 1)
    )
  );

  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(
    Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
  );

  // $set prevents accidental full-document replacement on existing records,
  // which was the root cause of "Invalid OTP" on re-sent OTPs.
  const saved = await VerificationToken.findOneAndUpdate(
    { userId, type },
    { $set: { otp: hashedOtp, expiresAt } },
    { upsert: true, new: true }
  );

  // [DEBUG] — remove after confirming OTP storage works
  console.log('[OTP STORE]', { userId, type, otp, expiresAt, savedId: saved?._id });

  return otp;
};

/**
 * Finds and validates an OTP document for a given user + type.
 * Throws ApiError on missing / expired / wrong OTP.
 * Deletes the document on expiry (belt-and-suspenders over the TTL index).
 */
const validateOTP = async (userId, type, otp) => {
  const tokenDoc = await VerificationToken.findOne({ userId, type });

  // [DEBUG] — remove after confirming OTP lookup works
  console.log('[OTP LOOKUP]', { userId, type, found: !!tokenDoc, expiresAt: tokenDoc?.expiresAt });

  if (!tokenDoc) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP not found or has expired. Please request a new one.'
    );
  }

  // Explicit expiry check: MongoDB's TTL janitor has up to ~60 s lag.
  if (tokenDoc.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: tokenDoc._id });
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP has expired. Please request a new one.'
    );
  }

  const isValid = await bcrypt.compare(otp, tokenDoc.otp);
  if (!isValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP.');
  }

  return tokenDoc;
};

/**
 * Generates access + refresh JWT pair, persists refresh token to the user doc,
 * and returns both tokens.
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

/* ──────────────────────────── Auth handlers ─────────────────────────────── */

// POST /auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existedUser = await User.findOne({ email, deletedAt: null });
  if (existedUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists.'
    );
  }

  const user = await User.create({
    email,
    password,
    role: USER_ROLES.APPLICANT,
    profile: {},
  });

  const createdUser = await User.findById(user._id).select(USER_PUBLIC_FIELDS);
  if (!createdUser) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Something went wrong while registering the user.'
    );
  }

  // Fire-and-forget — registration must not fail just because email is slow.
  createAndStoreOTP(user._id, TOKEN_TYPES.EMAIL_VERIFICATION)
    .then((otp) => sendVerificationOTP(email, otp).catch(() => { }))
    .catch(() => { });

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
        'User registered successfully. Please check your email for a verification OTP.'
      )
    );
});

// POST /auth/login
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

// POST /auth/logout
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

// POST /auth/refresh-token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

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
          { accessToken, refreshToken: newRefreshToken },
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

/* ──────────────────────────── Profile handlers ──────────────────────────── */

// GET /auth/profile
const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, req.user, 'Profile fetched successfully.')
    );
});

// PATCH /auth/profile
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
      new ApiResponse(HTTP_STATUS.OK, updatedUser, 'Profile updated successfully.')
    );
});

/* ──────────────────────────── OTP handlers ──────────────────────────────── */

// POST /auth/verify-email/send
const sendEmailVerificationOTPHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is required.');
  }

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No account found with this email.');
  }

  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  const otp = await createAndStoreOTP(user._id, TOKEN_TYPES.EMAIL_VERIFICATION);
  sendVerificationOTP(email, otp).catch(() => { });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        IS_DEV ? { otp } : {},
        'Verification OTP sent to your email.'
      )
    );
});

// POST /auth/verify-email/confirm
const verifyEmailOTPHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and OTP are required.');
  }

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No account found with this email.');
  }

  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  const tokenDoc = await validateOTP(
    user._id,
    TOKEN_TYPES.EMAIL_VERIFICATION,
    otp
  );

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  await user.save({ validateBeforeSave: false });

  await VerificationToken.deleteOne({ _id: tokenDoc._id });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, {}, 'Email verified successfully.'));
});

// POST /auth/reset-password/send
const sendPasswordResetOTPHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is required.');
  }

  const user = await User.findOne({ email, deletedAt: null });

  // Always 200 to prevent email enumeration — but include OTP in dev.
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

  const otp = await createAndStoreOTP(user._id, TOKEN_TYPES.PASSWORD_RESET);
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

// POST /auth/reset-password/confirm
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Email, OTP, and new password are required.'
    );
  }

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid request.');
  }

  const tokenDoc = await validateOTP(user._id, TOKEN_TYPES.PASSWORD_RESET, otp);

  user.password = newPassword; // pre-save hook on User model handles hashing
  await user.save({ validateBeforeSave: false });

  await VerificationToken.deleteOne({ _id: tokenDoc._id });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, {}, 'Password reset successfully.'));
});

/* ──────────────────────────────── Exports ───────────────────────────────── */

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
  sendEmailVerificationOTPHandler,
  verifyEmailOTPHandler,
  sendPasswordResetOTPHandler,
  resetPasswordHandler,
};
