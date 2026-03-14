import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { HTTP_STATUS } from '../constants.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Exclude soft-deleted users; also strip sessions array from req.user
    const user = await User.findOne({
      _id: decodedToken?._id,
      deletedAt: null,
    }).select('-password -sessions -deletedAt');

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid Access Token');
    }

    req.user = user;
    next();
  } catch (error) {
    // If it's already an ApiError, just pass it forward
    if (error instanceof ApiError) {
      return next(error);
    }
    // Otherwise wrap it (JWT errors usually fall here)
    next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        error?.message || 'Invalid access token'
      )
    );
  }
});
