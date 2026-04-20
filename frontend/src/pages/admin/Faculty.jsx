import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getFaculty, createFaculty, updateFaculty, deleteFaculty } from '../../services/endpoints';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// Faculty schema with validation
const facultySchema = z.object({
  faculty_id: z.string().min(1, 'Faculty ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  max_hours: z.number().int().positive('Max hours must be a positive number'),
  preferences: z.any().optional(),
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
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-12"></div></td>
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
        <path d="M70 60 L130 60 L130 140 L70 140 Z" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.1" />
        <circle cx="100" cy="90" r="15" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.2" />
        <circle cx="100" cy="140" r="10" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.2" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">No faculty members yet</h3>
    <p className="text-gray-400 mb-6">Get started by adding your first faculty member.</p>
    <button
      onClick={onAdd}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Add Faculty
    </button>
  </motion.div>
);

export default function Faculty() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(facultySchema),
    defaultValues: editingFaculty || {},
  });

  const { data: faculty, isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: getFaculty,
  });

  const createMutation = useMutation({
    mutationFn: createFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries(['faculty']);
      toast.success('Faculty added successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating faculty'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFaculty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['faculty']);
      toast.success('Faculty updated successfully');
      setIsModalOpen(false);
      setEditingFaculty(null);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error updating faculty'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries(['faculty']);
      toast.success('Faculty deleted');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting faculty'),
  });

  const onSubmit = (data) => {
    if (editingFaculty) {
      updateMutation.mutate({ id: editingFaculty.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (fac) => {
    setEditingFaculty(fac);
    reset(fac);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    reset({});
    setIsModalOpen(true);
  };

  // Filter faculty based on search term
  const filteredFaculty = useMemo(() => {
    if (!faculty) return [];
    if (!searchTerm) return faculty;
    const term = searchTerm.toLowerCase();
    return faculty.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term) ||
      f.department.toLowerCase().includes(term) ||
      f.faculty_id.toLowerCase().includes(term)
    );
  }, [faculty, searchTerm]);

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
            Manage Faculty
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search faculty..."
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
              <span className="hidden sm:inline">Add Faculty</span>
            </motion.button>
          </div>
        </div>

        {/* Table Card */}
        {filteredFaculty.length === 0 ? (
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Faculty ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Max Hours</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                    {filteredFaculty.map((fac) => (
                      <motion.tr
                        key={fac.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{fac.faculty_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{fac.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{fac.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{fac.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{fac.max_hours}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(fac)}
                            className="text-indigo-400 hover:text-indigo-300 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this faculty member?')) {
                                deleteMutation.mutate(fac.id);
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
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Faculty ID</label>
              <input
                {...register('faculty_id')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. F001"
              />
              {errors.faculty_id && <p className="text-red-400 text-sm mt-1">{errors.faculty_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Dr. John Doe"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. john@college.edu"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Teaching Hours per Week</label>
              <input
                type="number"
                {...register('max_hours', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 20"
              />
              {errors.max_hours && <p className="text-red-400 text-sm mt-1">{errors.max_hours.message}</p>}
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
                {editingFaculty ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}