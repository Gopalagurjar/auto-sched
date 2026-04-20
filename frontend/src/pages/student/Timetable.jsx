import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getCourses, getClassrooms } from '../../services/endpoints';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import { CalendarIcon, TableCellsIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periodNames = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'];
const BASE_DATE = new Date(2026, 2, 16); // adjust as needed

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function StudentTimetable() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: getClassrooms,
  });

  // ✅ Correctly placed useEffect inside component
  useEffect(() => {
    console.log('StudentTimetable useEffect, user:', user);
    if (!user?.student_group_id) {
      toast.error('Student group not found');
      setLoading(false);
      return;
    }

    console.log('Making request to /timetables/student/me');
    api.get('/timetables/student/me')
      .then(res => {
        console.log('Response:', res.data);
        setAssignments(res.data);
      })
      .catch(err => {
        console.error('Error:', err);
        toast.error(err.response?.data?.detail || 'Failed to load timetable');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const grid = Array(dayNames.length)
    .fill()
    .map(() => Array(periodNames.length).fill(null));

  assignments.forEach(item => {
    const { day, period } = item;
    if (day >= 0 && day < dayNames.length && period >= 0 && period < periodNames.length) {
      grid[day][period] = item;
    }
  });

  const courseMap = {};
  if (courses) {
    courses.forEach(c => { courseMap[c.id] = c.course_code; });
  }

  const roomMap = {};
  if (rooms) {
    rooms.forEach(r => { roomMap[r.id] = r.room_number; });
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("My Student Timetable", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("Generated from AutoSched", 14, 30);
      
      const tableColumn = ["Day", ...periodNames];
      const tableRows = dayNames.map((day, dayIdx) => [
        day,
        ...periodNames.map((_, periodIdx) => {
          const item = grid[dayIdx][periodIdx];
          return item ? `${courseMap[item.course_id]} (Rm ${roomMap[item.room_id]})` : '';
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
      doc.save("student_timetable.pdf");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const renderTableView = () => (
    <div className="overflow-x-auto rounded-xl border border-white/10 shadow-xl bg-white/5 backdrop-blur-sm">
      <table className="min-w-full text-white">
        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <tr>
            <th className="p-3 text-left font-semibold">Day / Period</th>
            {periodNames.map((p, i) => <th key={i} className="p-3 text-left font-semibold">{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {dayNames.map((day, dayIdx) => (
            <tr key={day} className="border-t border-white/10 hover:bg-white/5 transition">
              <td className="p-3 font-medium text-white/90">{day}</td>
              {periodNames.map((_, periodIdx) => {
                const item = grid[dayIdx][periodIdx];
                return (
                  <td key={periodIdx} className="p-3">
                    {item ? (
                      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-lg p-2 text-center">
                        <div className="font-semibold text-indigo-300">{courseMap[item.course_id]}</div>
                        <div className="text-xs text-gray-400">{roomMap[item.room_id]}</div>
                      </div>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCalendarView = () => {
    if (!assignments.length) return <div className="text-center text-gray-400 py-10">No events to display.</div>;

    const events = assignments.map(a => {
      const eventDate = addDays(BASE_DATE, a.day);
      const startHour = 8 + a.period;
      const endHour = startHour + 1;
      const start = new Date(eventDate); start.setHours(startHour, 0, 0);
      const end = new Date(eventDate); end.setHours(endHour, 0, 0);
      return {
        title: `${courseMap[a.course_id]} (${roomMap[a.room_id]})`,
        start: start.toISOString(),
        end: end.toISOString(),
        color: '#4f46e5',
        textColor: '#ffffff',
      };
    });

    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-xl" style={{ minHeight: '600px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          weekends={false}
          events={events}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="17:00:00"
          allDaySlot={false}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>
    );
  };

  if (loading || coursesLoading || roomsLoading) return <div className="p-6"><Skeleton count={10} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            My Timetable
          </h1>
          <div className="flex gap-2">
            <button onClick={exportToPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg hover:shadow-xl flex items-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5" /><span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg transition shadow-lg flex items-center gap-2 ${viewMode === 'table' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white/10 hover:bg-white/20'}`}>
              <TableCellsIcon className="w-5 h-5" /><span className="hidden sm:inline">Table</span>
            </button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg transition shadow-lg flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white/10 hover:bg-white/20'}`}>
              <CalendarIcon className="w-5 h-5" /><span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No published timetable available for your group.</p>
          </div>
        ) : viewMode === 'table' ? renderTableView() : renderCalendarView()}
      </div>
    </div>
  );
}