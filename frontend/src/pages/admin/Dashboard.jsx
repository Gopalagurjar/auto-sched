import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Stats Cards Configuration
const statsData = [
  { 
    name: 'Total Courses', 
    icon: AcademicCapIcon, 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    trend: '+12%',
    trendUp: true,
    iconBg: 'bg-blue-500'
  },
  { 
    name: 'Faculty Members', 
    icon: UserGroupIcon, 
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    trend: '+5%',
    trendUp: true,
    iconBg: 'bg-green-500'
  },
  { 
    name: 'Classrooms', 
    icon: BuildingLibraryIcon, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    trend: '0%',
    trendUp: false,
    iconBg: 'bg-purple-500'
  },
  { 
    name: 'Timetables Generated', 
    icon: ClockIcon, 
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    trend: '+28%',
    trendUp: true,
    iconBg: 'bg-amber-500'
  },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Stat Card Component
const StatCard = ({ name, value, icon: Icon, color, bgColor, trend, trendUp, iconBg }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-2xl"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-gray-400 text-sm font-medium">{name}</p>
        <p className="text-4xl font-bold text-white">{value}</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend}
          </span>
          {trendUp ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${iconBg} bg-opacity-20 flex items-center justify-center backdrop-blur-sm`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </motion.div>
);

// Quick Action Component
const QuickAction = ({ title, icon: Icon, to, color, description }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Link
      to={to}
      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 text-center group transition-all block"
    >
      <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-110 transition shadow-lg`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-xs">{description}</p>
    </Link>
  </motion.div>
);

// Recent Activity Component
const RecentActivity = () => {
  const activities = [
    { id: 1, action: 'New timetable generated', time: '2 minutes ago', status: 'success', icon: CheckCircleIcon },
    { id: 2, action: 'Faculty member added', time: '1 hour ago', status: 'info', icon: UserGroupIcon },
    { id: 3, action: 'Course CS101 updated', time: '3 hours ago', status: 'info', icon: AcademicCapIcon },
    { id: 4, action: 'Classroom L201 added', time: '1 day ago', status: 'success', icon: BuildingLibraryIcon },
    { id: 5, action: 'Timetable published', time: '2 days ago', status: 'success', icon: ClockIcon },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              item.status === 'success' ? 'bg-green-500/20' : 'bg-blue-500/20'
            }`}>
              <item.icon className={`w-4 h-4 ${
                item.status === 'success' ? 'text-green-400' : 'text-blue-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">{item.action}</p>
              <p className="text-gray-500 text-xs">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch data
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(res => res.data)
  });
  const { data: faculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => api.get('/faculty/').then(res => res.data)
  });
  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/classrooms/').then(res => res.data)
  });
  const { data: timetables } = useQuery({
    queryKey: ['timetables'],
    queryFn: () => api.get('/timetables/').then(res => res.data)
  });

  const { data: roomUtilization, isLoading: roomLoading } = useQuery({
    queryKey: ['roomUtilization'],
    queryFn: () => api.get('/analytics/room-utilization').then(res => res.data)
  });
  const { data: facultyLoad, isLoading: facultyLoadLoading } = useQuery({
    queryKey: ['facultyLoad'],
    queryFn: () => api.get('/analytics/faculty-load').then(res => res.data)
  });

  // Weekly trend data (mock - replace with real API)
  const weeklyTrend = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 6 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 7 },
    { day: 'Fri', count: 8 },
    { day: 'Sat', count: 3 },
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { ...statsData[0], value: courses?.length || 0 },
    { ...statsData[1], value: faculty?.length || 0 },
    { ...statsData[2], value: classrooms?.length || 0 },
    { ...statsData[3], value: timetables?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000" />
      </div>

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">
              {greeting}, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition flex items-center gap-2 backdrop-blur-sm border border-white/10"
            >
              <ArrowPathIcon className="w-4 h-4" /> Refresh
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/dashboard/admin/generate"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" /> Generate New
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Room Utilization - Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BuildingLibraryIcon className="w-5 h-5 text-indigo-400" />
                Room Utilization (Per Day)
              </h2>
              <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-sm text-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            {roomLoading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roomUtilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d3a', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Weekly Trend - Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-indigo-400" />
              Weekly Activity
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d3a', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Second Row - Faculty Load & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Faculty Load - Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-indigo-400" />
              Faculty Teaching Load
            </h2>
            {facultyLoadLoading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={facultyLoad}
                    dataKey="load"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.name}
                  >
                    {facultyLoad?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d3a', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RecentActivity />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              title="Add Course"
              icon={AcademicCapIcon}
              to="/dashboard/admin/courses"
              color="from-blue-500 to-cyan-500"
              description="Create new course"
            />
            <QuickAction
              title="Add Faculty"
              icon={UserGroupIcon}
              to="/dashboard/admin/faculty"
              color="from-green-500 to-emerald-500"
              description="Add faculty member"
            />
            <QuickAction
              title="Define Constraints"
              icon={ExclamationTriangleIcon}
              to="/dashboard/admin/constraints"
              color="from-purple-500 to-pink-500"
              description="Set scheduling rules"
            />
            <QuickAction
              title="View Reports"
              icon={ChartBarIcon}
              to="/dashboard/admin/reports"
              color="from-amber-500 to-orange-500"
              description="Analytics & insights"
            />
          </div>
        </motion.div>
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}