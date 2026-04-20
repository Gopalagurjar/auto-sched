import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../services/endpoints';
import toast from 'react-hot-toast';

export function useCourses() {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course created');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating course'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course updated');
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

  return {
    courses: coursesQuery.data,
    isLoading: coursesQuery.isLoading,
    createCourse: createMutation.mutate,
    updateCourse: updateMutation.mutate,
    deleteCourse: deleteMutation.mutate,
  };
}