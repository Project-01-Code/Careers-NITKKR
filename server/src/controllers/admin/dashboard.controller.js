import { Application } from '../../models/application.model.js';
import { Job } from '../../models/job.model.js';
import { User } from '../../models/user.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS, APPLICATION_STATUS, JOB_STATUS, USER_ROLES } from '../../constants.js';

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get overview statistics for the admin dashboard
 * @access  Admin, Reviewer
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        applicationsByStatus,
        totalJobs,
        jobsByStatus,
        totalUsers,
        recentApplications,
    ] = await Promise.all([
        // Application counts grouped by status
        Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Total jobs
        Job.countDocuments({ deletedAt: null }),

        // Jobs by status
        Job.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Total applicants
        User.countDocuments({ role: USER_ROLES.APPLICANT, deletedAt: null }),

        // Recent 5 applications
        Application.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'email profile')
            .populate('jobId', 'title advertisementNo')
            .select('applicationNumber status createdAt submittedAt'),
    ]);

    // Transform aggregation results into key-value objects
    const appStats = {};
    Object.values(APPLICATION_STATUS).forEach((s) => { appStats[s] = 0; });
    applicationsByStatus.forEach((item) => { appStats[item._id] = item.count; });

    const jobStats = {};
    Object.values(JOB_STATUS).forEach((s) => { jobStats[s] = 0; });
    jobsByStatus.forEach((item) => { jobStats[item._id] = item.count; });

    const totalApplications = Object.values(appStats).reduce((a, b) => a + b, 0);

    res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
            HTTP_STATUS.OK,
            {
                applications: {
                    total: totalApplications,
                    byStatus: appStats,
                },
                jobs: {
                    total: totalJobs,
                    byStatus: jobStats,
                },
                users: {
                    totalApplicants: totalUsers,
                },
                recentApplications,
            },
            'Dashboard statistics fetched successfully'
        )
    );
});

/**
 * @route   GET /api/v1/admin/dashboard/stats/job/:jobId
 * @desc    Get statistics for a specific job
 * @access  Admin, Reviewer
 */
export const getJobStats = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate('department', 'name code');

    if (!job) {
        throw new (await import('../../utils/apiError.js')).ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Job not found'
        );
    }

    const [applicationsByStatus, totalApplications] = await Promise.all([
        Application.aggregate([
            { $match: { jobId: job._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Application.countDocuments({ jobId: job._id }),
    ]);

    const statusBreakdown = {};
    Object.values(APPLICATION_STATUS).forEach((s) => { statusBreakdown[s] = 0; });
    applicationsByStatus.forEach((item) => { statusBreakdown[item._id] = item.count; });

    // Calculate days remaining
    const now = new Date();
    const deadline = new Date(job.applicationEndDate);
    const daysRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));

    res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
            HTTP_STATUS.OK,
            {
                job: {
                    _id: job._id,
                    title: job.title,
                    advertisementNo: job.advertisementNo,
                    department: job.department,
                    status: job.status,
                    applicationStartDate: job.applicationStartDate,
                    applicationEndDate: job.applicationEndDate,
                    daysRemaining,
                },
                applications: {
                    total: totalApplications,
                    byStatus: statusBreakdown,
                },
            },
            'Job statistics fetched successfully'
        )
    );
});
