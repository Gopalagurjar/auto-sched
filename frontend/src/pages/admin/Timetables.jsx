import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import TimetableCalendar from '../../components/TimetableCalendar';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Empty State Component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-4"
  >
    <div className="w-64 h-64 mb-8 opacity-50">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="40" width="120" height="120" rx="8" stroke="url(#gradient)" strokeWidth="2" fill="url(#gradient)" fillOpacity="0.1" />
        <line x1="60" y1="70" x2="140" y2="70" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="60" y1="100" x2="140" y2="100" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="60" y1="130" x2="140" y2="130" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="4 4" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">No timetables yet</h3>
    <p className="text-gray-400 mb-6">Get started by generating your first timetable.</p>
    <a
      href="/dashboard/admin/generate"
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
    >
      <CalendarIcon className="w-5 h-5" />
      Generate Timetable
    </a>
  </motion.div>
);

export default function Timetables() {
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState({ id: null, currentStatus: false });
  const [deleteTarget, setDeleteTarget] = useState(null); // single delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: timetables, isLoading } = useQuery({
    queryKey: ['timetables'],
    queryFn: () => api.get('/timetables/').then(res => res.data),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(res => res.data),
    enabled: !!selectedTimetable,
  });

  const { data: rooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/classrooms/').then(res => res.data),
    enabled: !!selectedTimetable,
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.post(`/timetables/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries(['timetables']);
      toast.success('Timetable published');
      setIsPublishModalOpen(false);
    },
    onError: () => toast.error('Failed to publish'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/timetables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['timetables']);
      toast.success('Timetable deleted');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => api.delete(`/timetables/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timetables']);
      toast.success(`Deleted ${selectedIds.length} timetable(s)`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    },
    onError: () => toast.error('Some deletions failed'),
  });

  useEffect(() => {
    if (timetables && timetables.length > 0) {
      setSelectAll(selectedIds.length === timetables.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, timetables]);

  const filteredTimetables = useMemo(() => {
    if (!timetables) return [];
    if (!searchTerm) return timetables;
    const term = searchTerm.toLowerCase();
    return timetables.filter(tt => 
      tt.name.toLowerCase().includes(term) ||
      (tt.generation_date && format(new Date(tt.generation_date), 'dd MMM yyyy').toLowerCase().includes(term))
    );
  }, [timetables, searchTerm]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(timetables.map(tt => tt.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteTarget(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleView = (timetable) => {
    setSelectedTimetable(timetable);
    setIsViewModalOpen(true);
  };

  const handlePublishClick = (id, currentStatus) => {
    if (currentStatus) {
      toast.error('Already published');
      return;
    }
    setPublishTarget({ id, currentStatus });
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    if (publishTarget.id) {
      publishMutation.mutate(publishTarget.id);
    }
  };

  const renderCalendarPreview = () => {
    if (!selectedTimetable) return null;
    let schedule = [];
    try {
      schedule = JSON.parse(selectedTimetable.timetable_data);
    } catch {
      return <p className="text-red-400">Invalid timetable data</p>;
    }

    const courseMap = {};
    if (courses) {
      courses.forEach(c => { courseMap[c.id] = c.course_code; });
    }
    const roomMap = {};
    if (rooms) {
      rooms.forEach(r => { roomMap[r.id] = r.room_number; });
    }

    return (
      <TimetableCalendar
        assignments={schedule}
        courseMap={courseMap}
        roomMap={roomMap}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gray-950 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton height={36} width={250} className="bg-white/10" />
            <div className="flex gap-3">
              <Skeleton height={36} width={200} className="bg-white/10" />
              <Skeleton height={36} width={120} className="bg-white/10" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton height={20} width={20} circle className="bg-white/10" />
                  <Skeleton height={20} width={200} className="bg-white/10" />
                  <Skeleton height={20} width={150} className="bg-white/10" />
                  <Skeleton height={20} width={80} className="bg-white/10" />
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <Skeleton height={24} width={24} circle className="bg-white/10" />
                    <Skeleton height={24} width={24} circle className="bg-white/10" />
                    <Skeleton height={24} width={24} circle className="bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
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
            Generated Timetables
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search timetables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={handleBulkDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg"
              >
                <TrashIcon className="w-5 h-5" />
                Delete Selected ({selectedIds.length})
              </motion.button>
            )}
          </div>
        </div>

        {filteredTimetables.length === 0 ? (
          <EmptyState />
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-indigo-600 bg-black/30 border-white/10 rounded focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Generated</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                    {filteredTimetables.map((tt) => (
                      <motion.tr
                        key={tt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(tt.id)}
                            onChange={() => handleSelect(tt.id)}
                            className="h-4 w-4 text-indigo-600 bg-black/30 border-white/10 rounded focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tt.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {tt.generation_date
                            ? format(new Date(tt.generation_date), 'dd MMM yyyy, HH:mm')
                            : 'Invalid date'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {tt.is_published ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">Published</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">Draft</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleView(tt)}
                            className="text-indigo-400 hover:text-indigo-300 transition"
                            title="Preview"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePublishClick(tt.id, tt.is_published)}
                            className={`transition ${tt.is_published ? 'text-gray-500 cursor-not-allowed' : 'text-green-400 hover:text-green-300'}`}
                            disabled={tt.is_published}
                            title={tt.is_published ? 'Already published' : 'Publish'}
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteClick(tt.id)}
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

        {/* Preview Modal */}
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Timetable Preview">
          {renderCalendarPreview()}
        </Modal>

        {/* Publish Confirmation Modal */}
        <Modal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} title="Confirm Publish">
          <div className="py-4">
            <p className="text-gray-300">
              Publish this timetable? It will become visible to faculty and students.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsPublishModalOpen(false)}
              className="px-4 py-2 border border-white/10 rounded-md text-gray-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPublish}
              disabled={publishMutation.isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {publishMutation.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </button>
          </div>
        </Modal>

        {/* Single Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Timetable">
          <div className="py-4">
            <p className="text-gray-300">
              Are you sure you want to delete this timetable? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-white/10 rounded-md text-gray-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {deleteMutation.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Delete Multiple Timetables">
          <div className="py-4">
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-bold text-white">{selectedIds.length}</span> timetable(s)? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2 border border-white/10 rounded-md text-gray-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleteMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {bulkDeleteMutation.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All'
              )}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}