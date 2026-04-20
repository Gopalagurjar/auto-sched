import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getConstraints, createConstraint, updateConstraint, deleteConstraint } from '../../services/endpoints';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// Constraint schema with validation
const constraintSchema = z.object({
  type: z.enum(['hard', 'soft'], { required_error: 'Type is required' }),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  penalty_weight: z.number().min(0, 'Penalty must be at least 0').default(1),
  is_active: z.boolean().default(true),
  parameters: z.string().optional(),
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
    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-12"></div></td>
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
        <circle cx="100" cy="100" r="60" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="8 8" fill="url(#gradient)" fillOpacity="0.1" />
        <path d="M70 70 L130 130 M130 70 L70 130" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="6 6" />
        <rect x="80" y="80" width="40" height="40" rx="4" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.2" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">No constraints yet</h3>
    <p className="text-gray-400 mb-6">Get started by adding your first constraint.</p>
    <button
      onClick={onAdd}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Add Constraint
    </button>
  </motion.div>
);

export default function Constraints() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(constraintSchema),
    defaultValues: editing || {},
  });

  const { data: constraints, isLoading } = useQuery({
    queryKey: ['constraints'],
    queryFn: getConstraints,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (data.parameters) {
        try {
          data.parameters = JSON.parse(data.parameters);
        } catch {
          throw new Error('Invalid JSON for parameters');
        }
      }
      return createConstraint(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['constraints']);
      toast.success('Constraint added');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (data.parameters) {
        try {
          data.parameters = JSON.parse(data.parameters);
        } catch {
          throw new Error('Invalid JSON for parameters');
        }
      }
      return updateConstraint(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['constraints']);
      toast.success('Constraint updated');
      setIsModalOpen(false);
      setEditing(null);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.detail || error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConstraint,
    onSuccess: () => {
      queryClient.invalidateQueries(['constraints']);
      toast.success('Constraint deleted');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting constraint'),
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
      parameters: item.parameters ? JSON.stringify(item.parameters) : '',
    };
    setEditing(item);
    reset(formData);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    reset({ type: 'hard', is_active: true, penalty_weight: 1 });
    setIsModalOpen(true);
  };

  // Filter constraints based on search term
  const filteredConstraints = useMemo(() => {
    if (!constraints) return [];
    if (!searchTerm) return constraints;
    const term = searchTerm.toLowerCase();
    return constraints.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.type.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.parameters && JSON.stringify(c.parameters).toLowerCase().includes(term))
    );
  }, [constraints, searchTerm]);

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
            Manage Constraints
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search constraints..."
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
              <span className="hidden sm:inline">Add Constraint</span>
            </motion.button>
          </div>
        </div>

        {/* Table Card */}
        {filteredConstraints.length === 0 ? (
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Penalty</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Parameters</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                    {filteredConstraints.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'hard' 
                              ? 'bg-red-500/20 text-red-300' 
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.penalty_weight}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.is_active ? (
                            <span className="text-green-400">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {item.parameters ? (
                            <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">
                              {JSON.stringify(item.parameters).substring(0, 30)}
                              {JSON.stringify(item.parameters).length > 30 ? '…' : ''}
                            </span>
                          ) : '-'}
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
                              if (window.confirm('Are you sure you want to delete this constraint?')) {
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
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Constraint' : 'Add Constraint'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hard">Hard</option>
                <option value="soft">Soft</option>
              </select>
              {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. No overlapping classes"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the constraint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Penalty Weight</label>
              <input
                type="number"
                step="0.1"
                {...register('penalty_weight', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1.0"
              />
              {errors.penalty_weight && <p className="text-red-400 text-sm mt-1">{errors.penalty_weight.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 text-indigo-600 bg-black/30 border-white/10 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-300">Active</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Parameters (JSON, optional)</label>
              <textarea
                {...register('parameters')}
                rows={3}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder='{"max_gap": 2, "preferred_rooms": ["R101"]}'
              />
              <p className="text-gray-500 text-xs mt-1">Enter a valid JSON object.</p>
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