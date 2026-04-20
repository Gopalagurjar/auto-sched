import api from './api';

// Courses
export const getCourses = () => api.get('/courses/').then(res => res.data);
export const createCourse = (data) => api.post('/courses/', data).then(res => res.data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data).then(res => res.data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`).then(res => res.data);

// Faculty
export const getFaculty = () => api.get('/faculty/').then(res => res.data);
export const createFaculty = (data) => api.post('/faculty/', data).then(res => res.data);
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data).then(res => res.data);
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`).then(res => res.data);

// Classrooms
export const getClassrooms = () => api.get('/classrooms/').then(res => res.data);
export const createClassroom = (data) => api.post('/classrooms/', data).then(res => res.data);
export const updateClassroom = (id, data) => api.put(`/classrooms/${id}`, data).then(res => res.data);
export const deleteClassroom = (id) => api.delete(`/classrooms/${id}`).then(res => res.data);

// Student Groups
export const getGroups = () => api.get('/groups/').then(res => res.data);
export const createGroup = (data) => api.post('/groups/', data).then(res => res.data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data).then(res => res.data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then(res => res.data);

// Constraints
export const getConstraints = () => api.get('/constraints/').then(res => res.data);
export const createConstraint = (data) => api.post('/constraints/', data).then(res => res.data);
export const updateConstraint = (id, data) => api.put(`/constraints/${id}`, data).then(res => res.data);
export const deleteConstraint = (id) => api.delete(`/constraints/${id}`).then(res => res.data);

// Timetable
export const generateTimetable = (params) => api.post('/timetables/generate', params).then(res => res.data);
export const getTimetables = () => api.get('/timetables/').then(res => res.data);
export const publishTimetable = (id) => api.post(`/timetables/${id}/publish`).then(res => res.data);