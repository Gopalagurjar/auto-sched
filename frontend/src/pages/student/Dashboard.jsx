import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  return (
    <div className="bg-gray-950 min-h-screen p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <Link
        to="/dashboard/student/timetable"
        className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition group max-w-md"
      >
        <CalendarIcon className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition" />
        <h2 className="text-xl font-semibold">My Timetable</h2>
        <p className="text-gray-400 mt-2">View your class schedule.</p>
      </Link>
    </div>
  );
}