// frontend/src/components/StudySphere/TimetableView.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimetableView() {
  const [view, setView] = useState('day'); // day, week, month
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, [date, view]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let url = '';
      const dateStr = date.toISOString().split('T')[0];
      if (view === 'day') {
        url = `/timetable/my/day/${dateStr}`;
      } else if (view === 'week') {
        // Get start of week
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
        const startStr = start.toISOString().split('T')[0];
        url = `/timetable/my/week/${startStr}`;
      } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        url = `/timetable/my/month/${year}/${month}`;
      }
      const res = await api.get(url);
      setEntries(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(date);
    if (view === 'day') newDate.setDate(newDate.getDate() + days);
    else if (view === 'week') newDate.setDate(newDate.getDate() + days * 7);
    else newDate.setMonth(newDate.getMonth() + days);
    setDate(newDate);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button onClick={() => setView('day')} className={view === 'day' ? 'btn-primary' : 'btn-secondary'}>Day</button>
          <button onClick={() => setView('week')} className={view === 'week' ? 'btn-primary' : 'btn-secondary'}>Week</button>
          <button onClick={() => setView('month')} className={view === 'month' ? 'btn-primary' : 'btn-secondary'}>Month</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
          <span className="font-medium">{date.toLocaleDateString()}</span>
          <button onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-white/40">No lessons scheduled.</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{entry.course_name}</p>
                <p className="text-sm text-white/60">{entry.teacher_name} • {entry.room_name}</p>
              </div>
              <div className="text-right text-sm text-white/40">
                <p>{entry.start_time.slice(0,5)} - {entry.end_time.slice(0,5)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}