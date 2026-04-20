import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function FacultyDashboard() {
  return (
    <div className="bg-gray-950 min-h-screen p-6 text-white">  {/* dark wrapper */}
      <h1 className="text-3xl font-bold mb-6">Faculty Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/dashboard/faculty/preferences"
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition group"
        >
          <CalendarIcon className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-xl font-semibold">Set My Preferences</h2>
          <p className="text-gray-400 mt-2">Indicate your availability and preferred time slots.</p>
        </Link>
        <Link
          to="/dashboard/faculty/timetable"
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition group"
        >
          <ClockIcon className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-xl font-semibold">My Timetable</h2>
          <p className="text-gray-400 mt-2">View your teaching schedule.</p>
        </Link>
      </div>
    </div>
  );
}