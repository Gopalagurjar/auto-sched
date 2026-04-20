import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from '../../services/endpoints';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// Classroom schema with validation
const classroomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  room_type: z.string().min(1, 'Room type is required'),
  equipment: z.string().optional(),
});

// Skeleton Loader Component
const SkeletonRow = () => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="animate-pulse"
  >
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
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
        <rect x="40" y="40" width="120" height="120" rx="8" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.1" />
        <rect x="60" y="60" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <rect x="90" y="60" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <rect x="120" y="60" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <rect x="60" y="90" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <rect x="90" y="90" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <rect x="120" y="90" width="20" height="20" rx="4" fill="url(#gradient)" fillOpacity="0.3" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">No classrooms yet</h3>
    <p className="text-gray-400 mb-6">Get started by adding your first classroom.</p>
    <button
      onClick={onAdd}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Add Classroom
    </button>
  </motion.div>
);

export default function Classrooms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(classroomSchema),
    defaultValues: editing || {},
  });

  const { data: classrooms, isLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: getClassrooms,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (data.equipment) {
        try {
          data.equipment = JSON.parse(data.equipment);
        } catch {
          throw new Error('Invalid JSON for equipment');
        }
      }
      return createClassroom(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['classrooms']);
      toast.success('Classroom added');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (data.equipment) {
        try {
          data.equipment = JSON.parse(data.equipment);
        } catch {
          throw new Error('Invalid JSON for equipment');
        }
      }
      return updateClassroom(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['classrooms']);
      toast.success('Classroom updated');
      setIsModalOpen(false);
      setEditing(null);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries(['classrooms']);
      toast.success('Classroom deleted');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting classroom'),
  });

  const onSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (item) => {
    const formData = {
      ...item,
      equipment: item.equipment ? JSON.stringify(item.equipment) : '',
    };
    setEditing(item);
    reset(formData);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    reset({});
    setIsModalOpen(true);
  };

  // Filter classrooms based on search term
  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];
    if (!searchTerm) return classrooms;
    const term = searchTerm.toLowerCase();
    return classrooms.filter(room =>
      room.room_number.toLowerCase().includes(term) ||
      room.room_type.toLowerCase().includes(term) ||
      (Array.isArray(room.equipment) && room.equipment.some(e => e.toLowerCase().includes(term))) ||
      (typeof room.equipment === 'string' && room.equipment.toLowerCase().includes(term))
    );
  }, [classrooms, searchTerm]);

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
            Manage Classrooms
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classrooms..."
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
              <span className="hidden sm:inline">Add Classroom</span>
            </motion.button>
          </div>
        </div>

        {/* Table Card */}
        {filteredClassrooms.length === 0 ? (
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Room Number</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Room Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Equipment</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                    {filteredClassrooms.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.room_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.room_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {Array.isArray(item.equipment) ? (
                            <div className="flex flex-wrap gap-1">
                              {item.equipment.map((eq, idx) => (
                                <span key={idx} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs">
                                  {eq}
                                </span>
                              ))}
                            </div>
                          ) : item.equipment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(item)}
                            className="text-indigo-400 hover:text-indigo-300 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this classroom?')) {
                                deleteMutation.mutate(item.id);
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
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Classroom' : 'Add Classroom'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Room Number</label>
              <input
                {...register('room_number')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. R101"
              />
              {errors.room_number && <p className="text-red-400 text-sm mt-1">{errors.room_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Capacity</label>
              <input
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 50"
              />
              {errors.capacity && <p className="text-red-400 text-sm mt-1">{errors.capacity.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
              <select
                {...register('room_type')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select type</option>
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Tutorial Room">Tutorial Room</option>
                <option value="Seminar Hall">Seminar Hall</option>
              </select>
              {errors.room_type && <p className="text-red-400 text-sm mt-1">{errors.room_type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Equipment (JSON array)</label>
              <input
                {...register('equipment')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder='["projector", "whiteboard"]'
              />
              <p className="text-gray-500 text-xs mt-1">Enter equipment as a JSON array, e.g., ["projector", "whiteboard"]</p>
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
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}