import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Component,
} from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import JobCard from "../components/JobCard";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────
// FIX #11 — Error Boundary wrapping JobCard list
// If any JobCard throws, only the list section crashes gracefully.
// ─────────────────────────────────────────────────────────────
class JobListErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, errorMessage: err?.message || "Unknown error" };
  }

  componentDidCatch(err, info) {
    console.error("[JobListErrorBoundary]", err, info);
  }

  reset = () => this.setState({ hasError: false, errorMessage: "" });

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-400 text-4xl">
              error
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-700">
            Something went wrong displaying jobs
          </h3>
          <p className="text-gray-500 text-sm mt-1">{this.state.errorMessage}</p>
          <button
            onClick={this.reset}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
// FIX #7 — Skeleton card component for loading state
// ─────────────────────────────────────────────────────────────
function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse space-y-3">
      <div className="h-5 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 bg-gray-100 rounded-full w-20" />
        <div className="h-6 bg-gray-100 rounded-full w-24" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Strips keys whose value is falsy or "All".
 * Both sides of a comparison are normalized before diffing —
 * FIX #5: eliminates false mismatches from empty/absent keys.
 */
function normalizeParams(obj) {
  const result = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v && v !== "All") result[k] = String(v);
  });
  return result;
}

/**
 * FIX #5 — normalize BOTH sides before diffing so that
 * { page: '' } vs absent 'page' key never triggers a spurious update.
 */
function paramsEqual(sp, next) {
  const a = normalizeParams(Object.fromEntries(sp.entries()));
  const b = normalizeParams(next);

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? "") !== (b[k] ?? "")) return false;
  }
  return true;
}

/** FIX #5 (extension) — extract error message with full axios fallback chain */
function extractError(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Failed to fetch jobs"
  );
}

/**
 * FIX #9 — tolerant payload extraction.
 * Handles:
 *   { data: { jobs, totalPages } }          ← standard
 *   { success: true, data: { jobs, ... } }  ← wrapped success
 *   { jobs, totalPages }                    ← flat
 *   Array                                   ← raw array
 */
function extractPayload(data) {
  // Unwrap one level of { success, data } or { data } if present
  const unwrapped =
    data?.data ??       // { data: { jobs, totalPages } }
    data?.result ??     // { result: { jobs, totalPages } }
    data ?? {};         // flat or raw

  const jobs = Array.isArray(unwrapped.jobs)
    ? unwrapped.jobs
    : Array.isArray(unwrapped)
    ? unwrapped             // raw array response
    : [];

  const totalPages =
    unwrapped.pagination?.totalPages ||
    unwrapped.totalPages ||
    unwrapped.total_pages ||
    1;

  return { jobs, totalPages };
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-derived filter values (URL = single source of truth) ──
  const searchTerm    = searchParams.get("search")          || "";
  const advertisementNo = searchParams.get("advertisementNo") || "";
  const designation   = searchParams.get("designation")     || "All";
  const department    = searchParams.get("department")      || "All";
  const payLevel      = searchParams.get("payLevel")        || "All";
  const recruitmentType = searchParams.get("recruitmentType") || "All";
  const category      = searchParams.get("category")       || "All";
  const sortBy        = searchParams.get("sortBy")          || "createdAt";
  const sortOrder     = searchParams.get("sortOrder")       || "desc";

  // FIX #4 — validate page: reject NaN, negative, non-integer values
  const rawPage = parseInt(searchParams.get("page"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // ── Local UI state ──
  // inputSearch / inputAdvNo are display-only controlled inputs;
  // they mirror URL values but allow typing before debounce fires.
  const [inputSearch, setInputSearch] = useState(searchTerm);
  const [inputAdvNo,  setInputAdvNo]  = useState(advertisementNo);

  const [departments,  setDepartments]  = useState([]);
  // FIX #10 — designations fetched from backend; falls back to static list
  const [designations, setDesignations] = useState([]);

  const [jobs,       setJobs]       = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [depsLoading, setDepsLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error,      setError]      = useState(null);

  // Retry counter — incrementing this re-triggers the fetch effect
  const [fetchTick, setFetchTick] = useState(0);
  const retryFetch = useCallback(() => {
    setError(null);
    setFetchTick((x) => x + 1);
  }, []);

  // Single debounce ref for both text inputs
  const debounceRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // FIX #1 — Sync controlled inputs when URL changes externally
  // (browser back/forward, pasted URLs, programmatic navigation)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setInputSearch(searchTerm);
    setInputAdvNo(advertisementNo);
  }, [searchTerm, advertisementNo]);

  // FIX #2 — Clear debounce timer on unmount to prevent memory-leak warnings
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // FIX #3 — pushFilters: clean merge without carrying empty keys.
  // `normalizeParams` strips falsy / "All" values before writing
  // to the URL, so dead keys are never written.
  // ─────────────────────────────────────────────────────────────
  const pushFilters = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        // Merge current params with updates (FIX #3: simple spread, no manual key list)
        const merged = {
          ...Object.fromEntries(prev.entries()),
          ...updates,
        };

        // FIX #5: normalize both sides before equality check
        if (paramsEqual(prev, merged)) return prev;

        // Write only non-empty, non-"All" keys
        const params = new URLSearchParams();
        Object.entries(normalizeParams(merged)).forEach(([k, v]) =>
          params.set(k, v)
        );

        return params;
      });
    },
    [setSearchParams]
  );

  // ─────────────────────────────────────────────────────────────
  // FIX #10 — Fetch designations from backend (GET /jobs/meta)
  // Falls back to a static list if endpoint is unavailable.
  // ─────────────────────────────────────────────────────────────
  const STATIC_DESIGNATIONS = [
    "Assistant Professor Grade-I",
    "Assistant Professor Grade-II",
  ];

  const STATIC_PAY_LEVELS = ["10", "11", "12", "13A2", "14A"];
  const STATIC_RECRUITMENT_TYPES = ["external", "internal"];
  const STATIC_CATEGORIES = ["GEN", "SC", "ST", "OBC", "EWS", "PwD"];

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setMetaLoading(true);
      try {
        const res = await api.get("/jobs/meta", { signal: controller.signal });

        const list =
          res?.data?.data?.designations ??
          res?.data?.designations ??
          null;

        if (Array.isArray(list) && list.length > 0) {
          setDesignations(list);
        } else {
          setDesignations(STATIC_DESIGNATIONS);
        }
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        if (!controller.signal.aborted) {
          // Endpoint may not exist yet — silently fall back
          setDesignations(STATIC_DESIGNATIONS);
        }
      } finally {
        if (!controller.signal.aborted) setMetaLoading(false);
      }
    })();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // ─────────────────────────────────────────────────────────────
  // Fetch departments
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setDepsLoading(true);
      try {
        const res = await api.get("/departments", { signal: controller.signal });

        const data =
          res?.data?.data ??
          res?.data?.departments ??
          res?.data ??
          [];

        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("[Jobs] departments fetch:", err);
          setDepartments([]);
        }
      } finally {
        if (!controller.signal.aborted) setDepsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Fetch jobs — driven entirely by URL params + fetchTick
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const params = { page, limit: 10 };

        if (searchTerm.trim())      params.search          = searchTerm.trim();
        if (advertisementNo.trim()) params.advertisementNo = advertisementNo.trim();
        if (designation !== "All")  params.designation     = designation;
        // FIX #6 — comment documents what the backend must receive
        // Change `department` to `departmentSlug` or `departmentCode` if needed
        if (department !== "All")   params.department      = department;
        if (payLevel !== "All")     params.payLevel        = payLevel;
        if (recruitmentType !== "All") params.recruitmentType = recruitmentType;
        if (category !== "All")      params.category       = category;
        
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;

        const res = await api.get("/jobs", {
          params,
          signal: controller.signal,
        });

        // FIX #9 — tolerant payload extraction (handles multiple response shapes)
        const { jobs: fetchedJobs, totalPages: fetchedTotal } =
          extractPayload(res?.data);

        setJobs(fetchedJobs);
        setTotalPages(fetchedTotal);

        // Reset to page 1 in URL when current page overshoots
        if (page > fetchedTotal && fetchedTotal > 0) {
          pushFilters({ page: "" });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("[Jobs] fetch:", err);
          setError(extractError(err));
          setJobs([]);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [
    searchTerm,
    advertisementNo,
    designation,
    department,
    payLevel,
    recruitmentType,
    category,
    sortBy,
    sortOrder,
    page,
    fetchTick,
    pushFilters,
    // NOTE: `api` is a stable module singleton — not listed to avoid lint noise,
    // but it never changes. FIX #14 (carried forward) documented here.
  ]);

  // ─────────────────────────────────────────────────────────────
  // Input handlers
  // ─────────────────────────────────────────────────────────────
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setInputSearch(val); // optimistic UI update

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ search: val, page: "" });
    }, 300);
  };

  const handleAdvInput = (e) => {
    const val = e.target.value;
    setInputAdvNo(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ advertisementNo: val, page: "" });
    }, 300);
  };

  const handleDesignation = (e) =>
    pushFilters({ designation: e.target.value, page: "" });

  const handleDepartment = (e) =>
    pushFilters({ department: e.target.value, page: "" });

  const handlePayLevel = (e) =>
    pushFilters({ payLevel: e.target.value, page: "" });

  const handleRecruitmentType = (e) =>
    pushFilters({ recruitmentType: e.target.value, page: "" });

  const handleCategory = (e) =>
    pushFilters({ category: e.target.value, page: "" });

  const handleSortBy = (e) =>
    pushFilters({ sortBy: e.target.value, page: "" });

  const handleSortOrder = (e) =>
    pushFilters({ sortOrder: e.target.value, page: "" });

  const changePage = (p) =>
    pushFilters({ page: p > 1 ? String(p) : "" });

  const clearFilters = () => {
    setInputSearch("");
    setInputAdvNo("");
    setError(null);
    setSearchParams(new URLSearchParams());
  };

  // FIX #8 — useMemo so pagination only recalculates when page/totalPages change
  // eslint-disable-next-line no-unused-vars
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];

    const maxVisible = 5;

    // Short-circuit when all pages fit without windowing
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end   = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if window is too short near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      {/* Hero */}
      <div className="bg-secondary text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Current Openings
          </h1>
          <p className="text-gray-300 max-w-2xl">
            Join our team of exceptional faculty members and researchers. Browse
            through the current opportunities below.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">

        {/* ── Filters ─────────────────────────────────────────── */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="flex-grow relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search by title, department, or keywords..."
              value={inputSearch}
              onChange={handleSearchInput}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* Advertisement No */}
          <div className="flex-shrink-0 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              tag
            </span>
            <input
              type="text"
              placeholder="Advertisement No (e.g., NITKKR/FAC/2026/CSE/001)"
              value={inputAdvNo}
              onChange={handleAdvInput}
              className="w-full lg:w-80 pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* Designation — FIX #10: populated from backend meta */}
          <div className="flex-shrink-0">
            <select
              value={designation}
              onChange={handleDesignation}
              disabled={metaLoading}
              className="w-full md:w-52 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white cursor-pointer shadow-sm appearance-none"
            >
              <option value="All">
                {metaLoading ? "Loading designations…" : "All Designations"}
              </option>
              {designations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Department — FIX #12 (carried): "Loading departments…" placeholder */}
          <div className="flex-shrink-0">
            <select
              value={department}
              onChange={handleDepartment}
              disabled={depsLoading}
              className="w-full md:w-52 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white cursor-pointer shadow-sm appearance-none"
            >
              <option value="All">
                {depsLoading ? "Loading departments…" : "All Departments"}
              </option>
              {departments.map((d) => (
                // FIX #6 — value is d._id ?? d.id; see fetch-jobs comment for backend note
                <option key={d._id ?? d.id} value={d._id ?? d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* ── Advanced Filters & Sorting ─────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-sm">filter_list</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">More Filters:</span>
          </div>

          {/* Pay Level */}
          <select
            value={payLevel}
            onChange={handlePayLevel}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white cursor-pointer"
          >
            <option value="All">All Pay Levels</option>
            {STATIC_PAY_LEVELS.map((pl) => (
              <option key={pl} value={pl}>Level {pl}</option>
            ))}
          </select>

          {/* Recruitment Type */}
          <select
            value={recruitmentType}
            onChange={handleRecruitmentType}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white cursor-pointer"
          >
            <option value="All">All Types</option>
            {STATIC_RECRUITMENT_TYPES.map((rt) => (
              <option key={rt} value={rt} className="capitalize">{rt}</option>
            ))}
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={handleCategory}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white cursor-pointer"
          >
            <option value="All">All Categories</option>
            {STATIC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="h-6 w-px bg-gray-200 mx-2 hidden lg:block" />

          {/* Sorting */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={handleSortBy}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white cursor-pointer"
            >
              <option value="createdAt">Posted Date</option>
              <option value="applicationEndDate">Deadline</option>
              <option value="payLevel">Pay Level</option>
            </select>
            <select
              value={sortOrder}
              onChange={handleSortOrder}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white cursor-pointer"
            >
              <option value="desc">Newest/Highest First</option>
              <option value="asc">Oldest/Lowest First</option>
            </select>
          </div>
        </div>

        {/* ── Job List ─────────────────────────────────────────── */}

        {/* FIX #7 — Skeleton cards while loading */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-4xl">
                error
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-700">
              Error loading jobs
            </h3>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            {/* FIX #7 (carried from prev iteration): retry via state, no page reload */}
            <button
              onClick={retryFetch}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-gray-400 text-4xl">
                search_off
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-700">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          // FIX #11 — Error boundary around job cards
          <JobListErrorBoundary>
            <div className="space-y-4">
              {jobs.map((job) => (
                // FIX #13 (carried): fallback key
                <JobCard key={job._id ?? job.id} job={job} />
              ))}
            </div>
          </JobListErrorBoundary>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 mb-10">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
              className="p-2.5 rounded-xl border border-gray-200 disabled:opacity-30 hover:border-primary hover:text-primary transition-all bg-white shadow-sm flex items-center justify-center"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl border border-gray-200 disabled:opacity-30 hover:border-primary hover:text-primary transition-all bg-white shadow-sm flex items-center justify-center"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Jobs;