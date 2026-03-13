import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Credit point caps and descriptions per activity as per NIT recruitment rules.
 * Activities 5-22 have specific maximum allowed points.
 */
const ACTIVITY_DETAILS = {
  5: { cap: 15, name: 'Refereed Journal papers' },
  6: { cap: 10, name: 'Conference papers' },
  7: { cap: 10, name: 'PH.D. Guidance' },
  8: { cap: 10, name: 'Patents' },
  9: { cap: 10, name: 'Books' },
  10: { cap: 10, name: 'Book Chapters' },
  11: { cap: 10, name: 'Organized Programs' },
  12: { cap: 10, name: 'Sponsored Projects' },
  13: { cap: 10, name: 'Consultancy Projects' },
  14: { cap: 10, name: 'Theory courses' },
  15: { cap: 10, name: 'Lab courses' },
  16: { cap: 10, name: 'New Lab development' },
  17: { cap: 10, name: 'PG Thesis guidance' },
  18: { cap: 10, name: 'UG Projects' },
  19: { cap: 10, name: 'Outreach activities' },
  20: { cap: 10, name: 'Administrative assignments' },
  21: { cap: 10, name: 'Departmental activities' },
  22: { cap: 10, name: 'Workshop/FDP/STTP' },
};

/**
 * Manual activity IDs 5-22 (server: activityId z.number().int().min(5).max(22))
 */
const MANUAL_ACTIVITY_IDS = Object.keys(ACTIVITY_DETAILS).map(Number);

const CreditPoints = ({ onNext, onBack }) => {
  const { formData, updateSection, applicationId } = useApplication();
  const [manualActivities, setManualActivities] = useState([]);
  const [serverSummary, setServerSummary] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (formData?.credit_points && typeof formData.credit_points === 'object') {
      const cp = formData.credit_points;
      setTimeout(() => {
        setManualActivities(cp.manualActivities || []);
      }, 0);
    }
  }, [formData?.credit_points]);

  // Fetch auto-calc summary from server
  useEffect(() => {
    if (!applicationId) return;
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await api.get(`/applications/${applicationId}/sections/credit_points/summary`);
        setServerSummary(res.data.data);
      } catch {
        setServerSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [applicationId]);

  const addActivity = () => {
    setManualActivities(prev => [...prev, { activityId: 5, description: '', claimedPoints: 0 }]);
  };

  const removeActivity = (idx) => {
    setManualActivities(prev => prev.filter((_, i) => i !== idx));
  };

  const updateActivity = (idx, field, val) => {
    setManualActivities(prev => {
      const upd = [...prev];

      // Auto-clamp claimed points based on activityId cap
      if (field === 'claimedPoints') {
        const currentActivityId = upd[idx].activityId || 5;
        const cap = ACTIVITY_DETAILS[currentActivityId]?.cap || 10;
        if (val > cap) {
          val = cap;
          toast.error(`Maximum allowed points for Activity ${currentActivityId} is ${cap}`);
        }
      }

      // If activityId changes, re-clamp existing claimed points if they exceed the new cap
      if (field === 'activityId') {
        const cap = ACTIVITY_DETAILS[val]?.cap || 10;
        if (upd[idx].claimedPoints > cap) {
          upd[idx].claimedPoints = cap;
          toast.error(`Points clamped to ${cap} for Activity ${val}`);
        }
      }

      upd[idx] = { ...upd[idx], [field]: val };
      return upd;
    });
  };

  const manualTotal = manualActivities.reduce((sum, a) => sum + (a.claimedPoints || 0), 0);
  const autoTotal = serverSummary?.autoCredits?.autoTotal || 0;
  const combinedTotal = autoTotal + manualTotal;

  const handleNext = async () => {
    // Validate manual activities
    const bad = manualActivities.some(a => !a.description?.trim() || a.claimedPoints < 0);
    if (bad) { toast.error('Please fill description and valid points for all activities'); return; }

    await updateSection('credit_points', {
      manualActivities,
      totalCreditsClaimed: combinedTotal, // Default save mapping defaults to auto + manual
      totalCreditsAllowed: 0, // Admin uses this later
    });

    if (onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Credit Point Calculation" subtitle="Self-assessment of credit points as per NIT statutes matrix." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {/* Server Auto-Calc Summary */}
        {serverSummary && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 mt-0.5">auto_awesome</span>
              <div className="w-full">
                <h4 className="font-semibold text-blue-900 text-sm">Automated Calculation Data (From Previous Steps)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-blue-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wider text-blue-600 font-bold mb-1">Base Auto Credits</span>
                    <p className="font-bold text-blue-900 text-xl">{autoTotal.toFixed(1)}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-blue-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wider text-blue-600 font-bold mb-1">Stored Manual</span>
                    <p className="font-bold text-blue-900 text-xl">{serverSummary.manualTotal?.toFixed(1) ?? '0.0'}</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg px-3 py-2 border border-blue-700 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[11px] uppercase tracking-wider text-blue-100 font-bold mb-1">Saved Total</span>
                    <p className="font-bold text-white text-xl">{serverSummary.grandTotal?.toFixed(1) ?? '0.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Important:</strong> Activities 1-4 are auto-calculated from your saved data. Below you can add manual activities (5-22) for items not auto-calculated. Points will be automatically capped at limits determined by NIT recruitment rules for each activity.
          </p>
        </div>

        {/* Manual Activities */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Manual Activities (5-22)</h3>
          {manualActivities.map((act, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Activity #{idx + 1}</span>
                <button onClick={() => removeActivity(idx)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="space-y-1 block">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Activity ID</label>
                  <select value={act.activityId} onChange={e => updateActivity(idx, 'activityId', parseInt(e.target.value))} className={ic}>
                    {MANUAL_ACTIVITY_IDS.map(id => <option key={id} value={id}>Activity {id} - {ACTIVITY_DETAILS[id]?.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2 block">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Description <span className="text-red-500">*</span></label>
                  <input value={act.description} onChange={e => updateActivity(idx, 'description', e.target.value)} className={ic} placeholder="Specific details about this activity" />
                </div>
                <div className="space-y-1 block relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Points Claimed</label>
                  <input type="number" step="0.1" min={0} max={ACTIVITY_DETAILS[act.activityId]?.cap || 10} value={act.claimedPoints === 0 ? '' : act.claimedPoints} onChange={e => {
                    const strVal = e.target.value;
                    if (strVal === '') { updateActivity(idx, 'claimedPoints', 0); return; }
                    let val = parseFloat(strVal);
                    if (isNaN(val)) val = 0;

                    const cap = ACTIVITY_DETAILS[act.activityId]?.cap || 10;
                    if (val > cap) val = cap;
                    updateActivity(idx, 'claimedPoints', val);
                  }} className={`${ic} text-right font-bold text-primary`} placeholder="0.0" />
                  <div className="text-[10px] text-gray-500 text-right mt-1 w-full absolute -bottom-5 right-1">
                    Max allowed: <span className="font-bold text-gray-700">{ACTIVITY_DETAILS[act.activityId]?.cap || 10}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addActivity} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add Manual Activity
          </button>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm pt-4">
          <div className="grid border-t border-gray-200 md:grid-cols-2">
            <div className="p-5 flex items-center justify-between border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-800 text-[15px] uppercase">Manual Total</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Sum of points from manual activities above</p>
              </div>
              <div className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 font-bold text-xl min-w-[90px] text-center">
                {manualTotal.toFixed(1)}
              </div>
            </div>

            <div className="p-5 flex items-center justify-between bg-primary/5">
              <div>
                <h4 className="font-bold text-primary-dark text-lg uppercase">Combined Total Point Result</h4>
                <p className="text-xs text-primary/70 mt-0.5 font-medium">Auto-Calculated Data + Current Manual Entries</p>
              </div>
              <div className="px-5 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/30 text-white font-bold text-2xl min-w-[100px] text-center">
                {combinedTotal.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};

export default CreditPoints;
