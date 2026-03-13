import React, { useState, useEffect } from 'react';

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

  const SliderRow = ({ label, value, max, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-secondary">{value} / {max}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={readOnly}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <h3 className="font-bold text-secondary text-sm uppercase tracking-wider">
        Structured Assessment Report
      </h3>

      {/* Score sliders */}
      <div className="space-y-4">
        <SliderRow
          label="Academic (Max 50)"
          value={academicScore}
          max={50}
          onChange={setAcademicScore}
        />
        <SliderRow
          label="Research (Max 30)"
          value={researchScore}
          max={30}
          onChange={setResearchScore}
        />
        <SliderRow
          label="Experience (Max 20)"
          value={experienceScore}
          max={20}
          onChange={setExperienceScore}
        />
      </div>

      {/* Total Score Gauge */}
      <div className="flex flex-col items-center py-4">
        <div
          className="relative w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center"
          style={{
            background: `conic-gradient(#c21717 0deg ${(totalScore / 100) * 360}deg, #f3f4f6 ${(totalScore / 100) * 360}deg 360deg)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <span className="text-2xl font-black text-secondary">{totalScore}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Total Score / 100</p>
      </div>

      {/* Verdict selector */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Recommendation</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(RECOMMENDATION_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => !readOnly && setRecommendation(key)}
              disabled={readOnly}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                recommendation === key
                  ? `${RECOMMENDATION_COLORS[key]} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add detailed assessment comments..."
          rows={4}
          readOnly={readOnly}
          className={`w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            readOnly ? 'bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
      </div>

      {!readOnly && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">send</span>
                Submit Assessment
              </>
            )}
          </button>
          <button
            onClick={() => handleSubmit('IN_PROGRESS')}
            disabled={submitting}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewScorecard;
