import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Manual activity IDs 5-22 (server: activityId z.number().int().min(5).max(22))
 */
const MANUAL_ACTIVITY_IDS = Array.from({ length: 18 }, (_, i) => i + 5);

const CreditPoints = ({ onNext, onBack }) => {
  const { formData, updateSection, applicationId } = useApplication();
  const [manualActivities, setManualActivities] = useState([]);
  const [totalCreditsClaimed, setTotalCreditsClaimed] = useState(0);
  const [totalCreditsAllowed, setTotalCreditsAllowed] = useState(0);
  const [serverSummary, setServerSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (formData?.creditPoints && typeof formData.creditPoints === 'object') {
      const cp = formData.creditPoints;
      setManualActivities(cp.manualActivities || []);
      setTotalCreditsClaimed(cp.totalCreditsClaimed || 0);
      setTotalCreditsAllowed(cp.totalCreditsAllowed || 0);
    }
  }, [formData?.creditPoints]);

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
      upd[idx] = { ...upd[idx], [field]: val };
      return upd;
    });
  };

  const manualTotal = manualActivities.reduce((sum, a) => sum + (a.claimedPoints || 0), 0);

  const handleNext = async () => {
    // Validate manual activities
    const bad = manualActivities.some(a => !a.description?.trim() || a.claimedPoints < 0);
    if (bad) { toast.error('Please fill description and valid points for all activities'); return; }
    await updateSection('creditPoints', {
      manualActivities,
      totalCreditsClaimed: totalCreditsClaimed || (serverSummary?.autoCredits?.autoTotal || 0) + manualTotal,
      totalCreditsAllowed: totalCreditsAllowed || 0,
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
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Auto-Calculated Credits (from your saved data)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-blue-600 font-medium">Auto Total</span>
                    <p className="font-bold text-blue-900">{serverSummary.autoCredits?.autoTotal ?? 0}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-xs text-blue-600 font-medium">Manual Total</span>
                    <p className="font-bold text-blue-900">{serverSummary.manualTotal ?? 0}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2 border-2 border-blue-200">
                    <span className="text-xs text-blue-600 font-medium">Grand Total</span>
                    <p className="font-bold text-blue-900">{serverSummary.grandTotal ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Important:</strong> Activities 1-4 are auto-calculated from your saved data. Below you can add manual activities (5-22) for items not auto-calculated.
          </p>
        </div>

        {/* Manual Activities */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Manual Activities (5-22)</h3>
          {manualActivities.map((act, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Activity #{idx + 1}</span>
                <button onClick={() => removeActivity(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">delete</span>Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Activity ID (5-22)</label>
                  <select value={act.activityId} onChange={e => updateActivity(idx, 'activityId', parseInt(e.target.value))} className={ic}>
                    {MANUAL_ACTIVITY_IDS.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Description *</label>
                  <input value={act.description} onChange={e => updateActivity(idx, 'description', e.target.value)} className={ic} placeholder="Activity description" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Points Claimed</label>
                  <input type="number" step="0.1" min={0} value={act.claimedPoints} onChange={e => updateActivity(idx, 'claimedPoints', parseFloat(e.target.value) || 0)} className={`${ic} text-right font-medium`} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addActivity} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">add_circle</span> Add Manual Activity
          </button>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Total Credits Claimed</label>
              <input type="number" step="0.1" min={0} value={totalCreditsClaimed} onChange={e => setTotalCreditsClaimed(parseFloat(e.target.value) || 0)} className={`${ic} text-right font-medium text-lg`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Total Credits Allowed</label>
              <input type="number" step="0.1" min={0} value={totalCreditsAllowed} onChange={e => setTotalCreditsAllowed(parseFloat(e.target.value) || 0)} className={`${ic} text-right font-medium text-lg`} />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-lg uppercase">Manual Activities Total</h4>
              <p className="text-xs text-gray-500">Sum of points from manual activities above</p>
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 text-white font-bold text-2xl min-w-[120px] text-center">
              {manualTotal.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};

export default CreditPoints;
