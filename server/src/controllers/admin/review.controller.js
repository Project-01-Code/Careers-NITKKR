import { Review } from '../../models/review.model.js';
import { Application } from '../../models/application.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAction } from '../../utils/auditLogger.js';
import {
  HTTP_STATUS,
  USER_ROLES,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  REVIEW_STATUS,
  REVIEW_RECOMMENDATION,
} from '../../constants.js';

export const getReviewerQueue = asyncHandler(async (req, res) => {
  const reviewerId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12; // Default to 12 as per frontend layout
  const skip = (page - 1) * limit;

  const filter = {
    assignedReviewers: reviewerId,
    status: { $in: ['submitted', 'under_review'] },
  };

  const totalApplications = await Application.countDocuments(filter);

  const applications = await Application.find(filter)
    .populate('userId', 'email profile')
    .populate('jobId', 'title advertisementNo department')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Attach review status for each application
  const reviews = await Review.find({
    reviewerId,
    applicationId: { $in: applications.map((a) => a._id) },
  }).lean();

  const reviewMap = {};
  reviews.forEach((r) => {
    reviewMap[r.applicationId.toString()] = r;
  });

  const queue = applications.map((app) => ({
    ...app,
    review: reviewMap[app._id.toString()] || null,
  }));

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        applications: queue,
        pagination: {
          total: totalApplications,
          page,
          limit,
          totalPages: Math.ceil(totalApplications / limit),
        },
      },
      'Reviewer queue fetched successfully'
    )
  );
});

/**
 * @route   POST /api/v1/admin/reviews/:applicationId
 * @desc    Submit or update a review scorecard for an application
 * @access  Reviewer (must be assigned)
 */
export const submitScorecard = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { scorecard, status } = req.body;
  const reviewerId = req.user._id;

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  const isAssigned = application.assignedReviewers?.some(
    (r) => r.toString() === reviewerId.toString()
  );
  if (!isAssigned) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
  }

  let review = await Review.findOne({ reviewerId, applicationId });

  if (!review) {
    review = new Review({
      reviewerId,
      applicationId,
      status: REVIEW_STATUS[0], // PENDING
    });
  }

  if (review && review.status === 'SUBMITTED') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This review has already been submitted and cannot be modified');
  }

  if (scorecard) {
    const { academicScore, researchScore, experienceScore, recommendation, comments } = scorecard;
    const clamp = (val, max) => Math.min(max, Math.max(0, Number(val) || 0));
    if (academicScore !== undefined) review.scorecard.academicScore = clamp(academicScore, 50);
    if (researchScore !== undefined) review.scorecard.researchScore = clamp(researchScore, 30);
    if (experienceScore !== undefined) review.scorecard.experienceScore = clamp(experienceScore, 20);
    if (recommendation && REVIEW_RECOMMENDATION.includes(recommendation)) {
      review.scorecard.recommendation = recommendation;
    }
    if (comments !== undefined) review.scorecard.comments = String(comments || '');
  }

  if (status && REVIEW_STATUS.includes(status)) {
    review.status = status;
  }

  if (scorecard || status === 'SUBMITTED') {
    review.status = status === 'SUBMITTED' ? 'SUBMITTED' : review.status;
  }

  await review.save();

  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.REVIEW_SUBMITTED,
    resourceType: RESOURCE_TYPES.REVIEW,
    resourceId: review._id,
    changes: { applicationId, scorecard: review.scorecard, status: review.status },
    req,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, review, 'Review scorecard saved successfully')
  );
});

/**
 * @route   GET /api/v1/admin/reviews/application/:id
 * @desc    Get expert reviews - Admin: all reviews, Reviewer: own review only
 * @access  Admin, Reviewer
 */
export const getReviewDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role);

  const application = await Application.findById(id);
  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (!isAdmin) {
    const isAssigned = application.assignedReviewers?.some(
      (r) => r.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
    }
  }

  const reviews = await Review.find({ applicationId: id })
    .populate('reviewerId', 'email profile')
    .lean();

  if (isAdmin) {
    // Return all assigned reviewers for admin, showing their status even if no Review doc exists/is pending
    const statusMap = {};
    reviews.forEach((r) => {
      statusMap[r.reviewerId._id.toString()] = r;
    });

    const populatedApp = await Application.findById(id).populate('assignedReviewers', 'email profile');
    const allReviewersStatus = (populatedApp.assignedReviewers || []).map((rev) => {
      const review = statusMap[rev._id.toString()];
      return {
        reviewer: rev,
        status: review?.status || 'PENDING',
        scorecard: review?.scorecard || null,
        updatedAt: review?.updatedAt || null,
        _id: review?._id || rev._id, // fallback to reviewer user id if no review doc
      };
    });

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, { reviews: allReviewersStatus }, 'Expert reviews fetched successfully')
    );
  }

  // For reviewers, keep existing logic (only see own review)
  const ownReview = reviews.filter(r => r.reviewerId._id.toString() === req.user._id.toString());
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { reviews: ownReview }, 'Expert reviews fetched successfully')
  );
});

/**
 * @route   GET /api/v1/admin/reviews/reviewers
 * @desc    Get list of reviewers for assignment (Admin only)
 * @access  Admin
 */
export const getReviewers = asyncHandler(async (req, res) => {
  const reviewers = await User.find({ role: USER_ROLES.REVIEWER })
    .select('_id email profile')
    .sort({ 'profile.firstName': 1, email: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { reviewers }, 'Reviewers fetched successfully')
  );
});
