import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

/**
 * Optional JWT authentication middleware.
 * Populates req.user if a valid token is present, but does NOT
 * reject the request when the token is missing or invalid.
 * Use on public routes that optionally enrich responses for logged-in users.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findOne({
      _id: decoded?._id,
      deletedAt: null,
    }).select('-password -sessions -deletedAt');

    if (user) req.user = user;
  } catch {
    // Silently ignore — user stays unauthenticated
  }

  next();
};
