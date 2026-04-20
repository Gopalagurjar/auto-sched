import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../services/endpoints';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// Course schema with validation
const courseSchema = z.object({
  course_code: z.string().min(1, 'Course code is required'),
  course_name: z.string().min(1, 'Course name is required'),
  department: z.string().min(1, 'Department is required'),
  semester: z.number().int().positive(),
  lecture_hours: z.number().int().nonnegative(),
  tutorial_hours: z.number().int().nonnegative(),
  practical_hours: z.number().int().nonnegative(),
  faculty_id: z.number().nullable().optional(),
});

// Skeleton Loader Component
const SkeletonRow = () => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="animate-pulse"
  >
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-12"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16 ml-auto"></div></td>
  </motion.tr>
);

// Empty State Component
const EmptyState = ({ onAdd }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-4"
  >
    <div className="w-64 h-64 mb-8 opacity-50">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="8 8" />
        <rect x="60" y="70" width="80" height="60" rx="8" fill="url(#gradient)" fillOpacity="0.2" stroke="url(#gradient)" strokeWidth="2" />
        <line x1="60" y1="90" x2="140" y2="90" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="60" y1="110" x2="140" y2="110" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="4 4" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">No courses yet</h3>
    <p className="text-gray-400 mb-6">Get started by adding your first course.</p>
    <button
      onClick={onAdd}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Add Course
    </button>
  </motion.div>
);

export default function Courses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: editingCourse || {},
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course added successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating course'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course updated successfully');
      setIsModalOpen(false);
      setEditingCourse(null);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error updating course'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course deleted');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting course'),
  });

  const onSubmit = (data) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    reset(course);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    reset({});
    setIsModalOpen(true);
  };

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (!searchTerm) return courses;
    const term = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.course_code.toLowerCase().includes(term) ||
      course.course_name.toLowerCase().includes(term) ||
      course.department.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  if (isLoading) {
    return (
      <div className="bg-gray-950 min-h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-white/10 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-white/10 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Manage Courses
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Add Course</span>
            </motion.button>
          </div>
        </div>

        {/* Table Card */}
        {filteredCourses.length === 0 ? (
          <EmptyState onAdd={openCreateModal} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dept</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sem</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours (L/T/P)</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                    {filteredCourses.map((course) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{course.course_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{course.course_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{course.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{course.semester}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {course.lecture_hours}/{course.tutorial_hours}/{course.practical_hours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(course)}
                            className="text-indigo-400 hover:text-indigo-300 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this course?')) {
                                deleteMutation.mutate(course.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCourse ? 'Edit Course' : 'Add Course'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Course Code</label>
              <input
                {...register('course_code')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. CS101"
              />
              {errors.course_code && <p className="text-red-400 text-sm mt-1">{errors.course_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Course Name</label>
              <input
                {...register('course_name')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Introduction to Computer Science"
              />
              {errors.course_name && <p className="text-red-400 text-sm mt-1">{errors.course_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
              <input
                {...register('department')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Computer Science"
              />
              {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                <input
                  type="number"
                  {...register('semester', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.semester && <p className="text-red-400 text-sm mt-1">{errors.semester.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Faculty ID (optional)</label>
                <input
                  type="number"
                  {...register('faculty_id', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lecture Hours</label>
                <input
                  type="number"
                  {...register('lecture_hours', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.lecture_hours && <p className="text-red-400 text-sm mt-1">{errors.lecture_hours.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tutorial Hours</label>
                <input
                  type="number"
                  {...register('tutorial_hours', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.tutorial_hours && <p className="text-red-400 text-sm mt-1">{errors.tutorial_hours.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Practical Hours</label>
                <input
                  type="number"
                  {...register('practical_hours', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.practical_hours && <p className="text-red-400 text-sm mt-1">{errors.practical_hours.message}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCourse ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}