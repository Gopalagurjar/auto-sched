import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = ['9:00‑10:00', '10:00‑11:00', '11:00‑12:00', '12:00‑13:00', '14:00‑15:00', '15:00‑16:00'];

export default function Preferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.faculty_id) {
      toast.error('Faculty ID not found – please log in as faculty');
      setLoading(false);
      return;
    }

    api.get('/faculty/my-info')   // ✅ new endpoint
      .then(res => {
        setPreferences(res.data.preferences || {});
      })
      .catch(err => {
        toast.error('Failed to load preferences');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleCellClick = (day, period) => {
    const key = `${day}-${period}`;
    const current = preferences[key] || 0;
    let newValue;
    if (current === 0) newValue = 1;
    else if (current === 1) newValue = -1;
    else newValue = 0;
    setPreferences(prev => ({ ...prev, [key]: newValue }));
  };

  const getCellColor = (value) => {
    if (value === 1) return 'bg-green-600 hover:bg-green-700';
    if (value === -1) return 'bg-red-600 hover:bg-red-700';
    return 'bg-gray-700 hover:bg-gray-600';
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/faculty/me/preferences', preferences);
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  return (
    <div className="bg-gray-950 min-h-screen p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Set Your Teaching Preferences</h1>
      <p className="text-gray-400 mb-4">
        Click on a time slot to cycle: 
        <span className="bg-green-600 px-2 py-1 rounded mx-2">Preferred</span>
        <span className="bg-red-600 px-2 py-1 rounded mx-2">Unavailable</span>
        <span className="bg-gray-700 px-2 py-1 rounded mx-2">Neutral</span>
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-white/10">
          <thead>
            <tr>
              <th className="border p-2">Day / Period</th>
              {periods.map((p, i) => <th key={i} className="border p-2">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIdx) => (
              <tr key={day}>
                <td className="border p-2 font-medium">{day}</td>
                {periods.map((_, periodIdx) => {
                  const key = `${dayIdx}-${periodIdx}`;
                  const value = preferences[key] || 0;
                  return (
                    <motion.td
                      key={periodIdx}
                      whileTap={{ scale: 0.95 }}
                      className={`border p-2 text-center cursor-pointer ${getCellColor(value)} transition`}
                      onClick={() => handleCellClick(dayIdx, periodIdx)}
                    >
                      {value === 1 && '✓'}
                      {value === -1 && '✗'}
                    </motion.td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}