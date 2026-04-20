import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  ArrowPathIcon, 
  Cog6ToothIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { getCourses } from '../../services/endpoints';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periodNames = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'];

// Parameter ranges
const paramConfig = {
  population_size: { min: 10, max: 500, default: 100, step: 10, label: 'Population Size' },
  generations: { min: 10, max: 1000, default: 200, step: 10, label: 'Generations' },
  mutation_rate: { min: 0.01, max: 0.5, default: 0.1, step: 0.01, label: 'Mutation Rate' },
  crossover_rate: { min: 0.5, max: 1.0, default: 0.8, step: 0.05, label: 'Crossover Rate' },
};

export default function Generate() {
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [showParams, setShowParams] = useState(false);
  const [params, setParams] = useState({
    population_size: paramConfig.population_size.default,
    generations: paramConfig.generations.default,
    mutation_rate: paramConfig.mutation_rate.default,
    crossover_rate: paramConfig.crossover_rate.default,
  });

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    retry: 1,
  });

  // ✅ FIXED: Send all required parameters
  const generateMutation = useMutation({
    mutationFn: ({ courseIds, algoParams }) =>
      api.post('/timetables/generate', {
        course_ids: courseIds,
        population_size: algoParams.population_size,
        generations: algoParams.generations,
        mutation_rate: algoParams.mutation_rate,
        crossover_rate: algoParams.crossover_rate,
      }).then(res => res.data),
    onSuccess: (data) => {
      console.log('✅ Raw response:', data);
      setGeneratedTimetable(data);
      toast.success('Timetable generated successfully!');
    },
    onError: (error) => {
      console.error('❌ Generation error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        // Show detailed validation errors if available
        const detail = error.response?.data?.detail;
        if (typeof detail === 'object' && detail.errors) {
          toast.error(detail.errors.map(e => e.msg).join(', '));
        } else {
          toast.error(detail || 'Generation failed');
        }
      }
    },
  });

  const handleCheckboxChange = (courseId) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (courses) {
      if (selectedCourseIds.length === courses.length) {
        setSelectedCourseIds([]);
      } else {
        setSelectedCourseIds(courses.map(c => c.id));
      }
    }
  };

  const handleGenerate = () => {
    if (selectedCourseIds.length === 0) {
      toast.error('Please select at least one course');
      return;
    }
    // Pass both course IDs and current parameters
    generateMutation.mutate({ courseIds: selectedCourseIds, algoParams: params });
  };

  // PDF Export (unchanged, but included for completeness)
  const exportToPDF = () => {
    if (!generatedTimetable) return;

    let schedule = [];
    try {
      schedule = JSON.parse(generatedTimetable.timetable_data);
    } catch (e) {
      toast.error('Invalid timetable data, cannot export');
      return;
    }

    const grid = Array(dayNames.length).fill().map(() => Array(periodNames.length).fill(null));
    schedule.forEach(item => {
      const { day, period } = item;
      if (day >= 0 && day < dayNames.length && period >= 0 && period < periodNames.length) {
        grid[day][period] = item;
      }
    });

    const courseMap = {};
    if (courses) {
      courses.forEach(c => { courseMap[c.id] = c.course_code; });
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Generated Timetable", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Day", ...periodNames];
    const tableRows = dayNames.map((day, dayIdx) => [
      day,
      ...periodNames.map((_, periodIdx) => {
        const item = grid[dayIdx][periodIdx];
        return item ? `${courseMap[item.course_id]} (Rm ${item.room_id})` : '';
      })
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 0: { cellWidth: 30 } },
    });

    doc.save(`timetable-${generatedTimetable.id || 'generated'}.pdf`);
    toast.success('Timetable exported as PDF');
  };

  const renderTimetableGrid = () => {
    if (!generatedTimetable) return null;

    let schedule = [];
    try {
      schedule = JSON.parse(generatedTimetable.timetable_data);
    } catch (e) {
      return <p className="text-red-400">Invalid timetable data</p>;
    }

    const grid = Array(dayNames.length).fill().map(() => Array(periodNames.length).fill(null));
    schedule.forEach(item => {
      const { day, period } = item;
      if (day >= 0 && day < dayNames.length && period >= 0 && period < periodNames.length) {
        grid[day][period] = item;
      }
    });

    const courseMap = {};
    if (courses) {
      courses.forEach(c => { courseMap[c.id] = c.course_code; });
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 lg:mt-0"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Generated Timetable
          </h2>
          <button
            onClick={exportToPDF}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
            title="Export as PDF"
          >
            <DocumentArrowDownIcon className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="min-w-full text-white">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-400">Day / Period</th>
                {periodNames.map((p, i) => (
                  <th key={i} className="p-3 text-left text-sm font-medium text-gray-400">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {dayNames.map((day, dayIdx) => (
                <tr key={day} className="hover:bg-white/5 transition">
                  <td className="p-3 font-medium text-white">{day}</td>
                  {periodNames.map((_, periodIdx) => {
                    const item = grid[dayIdx][periodIdx];
                    return (
                      <td key={periodIdx} className="p-3">
                        {item ? (
                          <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-2 text-center hover:bg-indigo-500/20 transition">
                            <div className="font-semibold text-indigo-300 text-sm">
                              {courseMap[item.course_id] || `Course ${item.course_id}`}
                            </div>
                            <div className="text-xs text-gray-400">Room {item.room_id}</div>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="mt-4 group">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1">
            <ChevronDownIcon className="w-4 h-4 group-open:rotate-180 transition" />
            Show raw assignments
          </summary>
          <pre className="text-xs text-gray-300 mt-2 p-3 bg-black/30 rounded-lg overflow-x-auto">
            {JSON.stringify(schedule, null, 2)}
          </pre>
        </details>
      </motion.div>
    );
  };

  if (coursesLoading) {
    return (
      <div className="bg-gray-950 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton height={40} width={250} className="mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton height={200} />
              <Skeleton height={150} />
            </div>
            <div className="space-y-4">
              <Skeleton height={300} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="bg-gray-950 min-h-screen p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-400">Failed to load courses. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">
          Generate New Timetable
        </h1>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Course Selection Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-400 rounded-full" />
                Select Courses
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Choose the courses to include in the timetable. Each course will be assigned a unique time slot and room.
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">
                    Available ({courses?.length || 0})
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {selectedCourseIds.length === courses?.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-white/10 rounded-lg bg-black/20 p-2">
                  {courses?.map(course => (
                    <label
                      key={course.id}
                      className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => handleCheckboxChange(course.id)}
                        className="h-4 w-4 text-indigo-600 bg-black/30 border-white/10 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-white flex-1">
                        <span className="font-medium">{course.course_code}</span> – {course.course_name}
                        <span className="text-gray-400 text-xs ml-2">({course.department})</span>
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Selected {selectedCourseIds.length} of {courses?.length || 0} courses
                </p>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={generateMutation.isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generateMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="w-5 h-5" />
                      Generate Timetable
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Parameters Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <button
                onClick={() => setShowParams(!showParams)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Cog6ToothIcon className="w-5 h-5 text-indigo-400" />
                  Algorithm Parameters
                </h2>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${showParams ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showParams && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      {Object.entries(paramConfig).map(([key, config]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {config.label}
                          </label>
                          <input
                            type="range"
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            value={params[key]}
                            onChange={(e) => setParams({ ...params, [key]: parseFloat(e.target.value) })}
                            className="w-full accent-indigo-500"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{config.min}</span>
                            <span className="text-white">{params[key]}</span>
                            <span>{config.max}</span>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 italic">
                        These parameters control the genetic algorithm behavior.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Column – Generated Timetable */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {renderTimetableGrid()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}