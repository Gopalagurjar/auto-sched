import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const dayIndexMap = [1, 2, 3, 4, 5]; // Monday=1, Tuesday=2, ..., Friday=5

export default function TimetableCalendar({ assignments, courseMap, roomMap }) {
  const events = assignments.map(a => {
    const dayOfWeek = dayIndexMap[a.day];
    return {
      title: `${courseMap[a.course_id] || `Course ${a.course_id}`} (Room ${roomMap[a.room_id] || a.room_id})`,
      daysOfWeek: [dayOfWeek],
      startTime: `${8 + a.period}:00`,
      endTime: `${9 + a.period}:00`,
      color: '#4f46e5',
      textColor: '#fff',
    };
  });

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      weekends={false}
      events={events}
      height="auto"
      slotMinTime="08:00:00"
      slotMaxTime="18:00:00"
      allDaySlot={false}
    />
  );
}