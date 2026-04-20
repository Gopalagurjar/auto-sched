import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { DocumentArrowUpIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const entityConfig = {
  courses: {
    label: 'Courses',
    fields: ['course_code', 'course_name', 'department', 'semester', 'lecture_hours', 'tutorial_hours', 'practical_hours', 'faculty_id'],
    required: ['course_code', 'course_name', 'department', 'semester'],
    exampleLink: '/sample_courses.xlsx'
  },
  faculty: {
    label: 'Faculty',
    fields: ['faculty_id', 'name', 'email', 'department', 'max_hours'],
    required: ['faculty_id', 'name', 'email', 'department'],
    exampleLink: '/sample_faculty.xlsx'
  },
  classrooms: {
    label: 'Classrooms',
    fields: ['room_number', 'capacity', 'room_type', 'equipment'],
    required: ['room_number', 'capacity', 'room_type'],
    exampleLink: '/sample_classrooms.xlsx'
  },
  groups: {
    label: 'Student Groups',
    fields: ['group_id', 'department', 'semester', 'enrolled_courses'],
    required: ['group_id', 'department', 'semester'],
    exampleLink: '/sample_groups.xlsx'
  }
};

export default function Import() {
  const [entity, setEntity] = useState('courses');
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');

  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/upload/${entity}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.imported} records.`);
      setFile(null);
      setData([]);
      setPreview([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Import failed');
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');

    // Preview the file
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) {
        setError('File is empty');
        setPreview([]);
        return;
      }
      // Check headers
      const firstRow = rows[0];
      const config = entityConfig[entity];
      const missingFields = config.fields.filter(f => !firstRow.hasOwnProperty(f));
      if (missingFields.length > 0) {
        setError(`Missing columns: ${missingFields.join(', ')}. Please ensure your file has all required columns.`);
        setPreview([]);
        return;
      }
      setData(rows);
      setPreview(rows.slice(0, 5)); // show first 5 rows as preview
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    importMutation.mutate();
  };

  const clearFile = () => {
    setFile(null);
    setData([]);
    setPreview([]);
    setError('');
    document.getElementById('file-input').value = '';
  };

  const downloadSample = () => {
    const config = entityConfig[entity];
    const headers = config.fields;
    const sampleRows = [headers];
    // Add a sample row
    if (entity === 'courses') {
      sampleRows.push(['CS101', 'Intro to CS', 'CS', 1, 3, 0, 0, 1]);
    } else if (entity === 'faculty') {
      sampleRows.push(['F001', 'Dr. John Doe', 'john@college.edu', 'CS', 20]);
    } else if (entity === 'classrooms') {
      sampleRows.push(['R101', 50, 'Lecture Hall', '["projector","whiteboard"]']);
    } else if (entity === 'groups') {
      sampleRows.push(['CSE2026', 'CS', 1, '[1,2,3,4,5]']);
    }
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, `sample_${entity}.xlsx`);
  };

  return (
    <div className="bg-gray-950 min-h-screen p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">
          Import Data
        </h1>

        {/* Entity selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Entity</label>
          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); clearFile(); }}
            className="w-full md:w-64 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="courses">Courses</option>
            <option value="faculty">Faculty</option>
            <option value="classrooms">Classrooms</option>
            <option value="groups">Student Groups</option>
          </select>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/50 transition">
            <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-300 mb-2">
              Drag and drop your Excel file here, or{' '}
              <label className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                browse
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-gray-500 text-sm">Supports .xlsx, .xls, .csv</p>
            {file && (
              <div className="mt-4 flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-300">{file.name}</span>
                <button onClick={clearFile} className="text-red-400 hover:text-red-300">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Preview (first 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      {entityConfig[entity].fields.map(field => (
                        <th key={field} className="px-4 py-2 text-left text-gray-400">{field}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t border-white/10">
                        {entityConfig[entity].fields.map(field => (
                          <td key={field} className="px-4 py-2 text-white">
                            {row[field] !== undefined ? String(row[field]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-500 text-xs mt-2">Total rows: {data.length}</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={downloadSample}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 transition"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download Sample
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImport}
              disabled={!file || importMutation.isLoading}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {importMutation.isLoading ? 'Importing...' : 'Import Data'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}