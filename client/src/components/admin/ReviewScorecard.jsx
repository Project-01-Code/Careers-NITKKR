import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const RECOMMENDATION_LABELS = {
  RECOMMENDED: 'Recommended',
  NOT_RECOMMENDED: 'Not Recommended',
  HOLD: 'Hold',
};

const RECOMMENDATION_COLORS = {
  RECOMMENDED: 'bg-green-500',
  NOT_RECOMMENDED: 'bg-red-500',
  HOLD: 'bg-amber-500',
};

const ScoreInputRow = ({ label, value, max, onChange, readOnly }) => (
  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/30 group">
    <div className="flex justify-between items-center">
      <div className="space-y-0.5">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{label}</span>
        <span className="text-[10px] font-bold text-secondary">Expert Score</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="number"
            min={0}
            max={max}
            step={0.5}
            value={value}
            onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
            disabled={readOnly}
            placeholder="0"
            className="w-16 px-2 py-2 bg-white rounded-xl border border-gray-200 text-base font-black text-primary text-center focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-gray-300 uppercase leading-none">MAX</span>
          <span className="text-xs font-black text-gray-400">{max}</span>
        </div>
      </div>
    </div>
  </div>
);

const ReviewScorecard = ({ initialData, onSubmit, readOnly = false }) => {
  const [academicScore, setAcademicScore] = useState(initialData?.scorecard?.academicScore ?? 0);
  const [researchScore, setResearchScore] = useState(initialData?.scorecard?.researchScore ?? 0);
  const [experienceScore, setExperienceScore] = useState(initialData?.scorecard?.experienceScore ?? 0);
  const [recommendation, setRecommendation] = useState(initialData?.scorecard?.recommendation ?? 'HOLD');
  const [comments, setComments] = useState(initialData?.scorecard?.comments ?? '');
  const [submitting, setSubmitting] = useState(false);

  const totalScore = academicScore + researchScore + experienceScore;

  useEffect(() => {
    if (initialData?.scorecard) {
      setAcademicScore(initialData.scorecard.academicScore ?? 0);
      setResearchScore(initialData.scorecard.researchScore ?? 0);
      setExperienceScore(initialData.scorecard.experienceScore ?? 0);
      setRecommendation(initialData.scorecard.recommendation ?? 'HOLD');
      setComments(initialData.scorecard.comments ?? '');
    }
  }, [initialData]);

  const handleSubmit = async (status = 'SUBMITTED') => {
    if (readOnly) return;
    setSubmitting(true);
    try {
      await onSubmit({
        scorecard: {
          academicScore,
          researchScore,
          experienceScore,
          recommendation,
          comments,
        },
        status,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-lg shadow-gray-200/30 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div>
          <h3 className="font-black text-secondary text-xs uppercase tracking-widest">
            Structured Assessment
          </h3>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Evaluation Report</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
          <div className="text-right">
            <p className="text-[8px] font-black text-secondary leading-none">SCORE</p>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-xl font-black text-primary">{totalScore}<span className="text-[9px] text-gray-300 ml-0.5">/100</span></span>
        </div>
      </div>

      {/* Score Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScoreInputRow
          label="Academic"
          value={academicScore}
          max={50}
          onChange={setAcademicScore}
          readOnly={readOnly}
        />
        <ScoreInputRow
          label="Research"
          value={researchScore}
          max={30}
          onChange={setResearchScore}
          readOnly={readOnly}
        />
        <ScoreInputRow
          label="Experience"
          value={experienceScore}
          max={20}
          onChange={setExperienceScore}
          readOnly={readOnly}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
        {/* Recommendation */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Recommendation</p>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(RECOMMENDATION_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => !readOnly && setRecommendation(key)}
                disabled={readOnly}
                className={`relative px-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-tight transition-all overflow-hidden ${recommendation === key
                    ? `${RECOMMENDATION_COLORS[key]} text-white shadow-md`
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  } ${readOnly ? 'cursor-default' : 'active:scale-95'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Verification Notes</p>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Notes..."
            rows={2}
            readOnly={readOnly}
            className={`w-full p-2.5 rounded-xl border border-gray-100 text-[11px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none ${readOnly ? 'bg-gray-50/50 cursor-not-allowed text-gray-500' : 'bg-gray-50/30 hover:bg-white focus:bg-white border-gray-200/50'
              }`}
          />
        </div>
      </div>

      {!readOnly && initialData?.status !== 'SUBMITTED' && (
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to submit this assessment? It will be locked for editing once submitted.')) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group"
          >
            {submitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">verified</span>
                Submit
              </>
            )}
          </button>
          <button
            onClick={() => handleSubmit('IN_PROGRESS')}
            disabled={submitting}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            Draft
          </button>
        </div>
      )}

      {initialData?.status === 'SUBMITTED' && (
        <div className="pt-2 border-t border-gray-50 text-center">
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span>
            Assessment Locked (Submitted)
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default ReviewScorecard;