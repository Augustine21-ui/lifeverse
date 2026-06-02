import { Zap } from "lucide-react";

const schedule = [
  { time: "7:00 AM", subject: "Mathematics", status: "done" },
  { time: "9:00 AM", subject: "Biology", status: "now" },
  { time: "11:00 AM", subject: "Computer Science", status: "soon" },
  { time: "2:00 PM", subject: "Physics", status: "soon" },
  { time: "4:00 PM", subject: "English", status: "soon" },
];

const statusStyles = {
  done: "bg-green-500/20 text-green-400 border border-green-500/30",
  now: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  soon: "bg-white/10 text-white/40 border border-white/10",
};

export default function Timetable() {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
        TODAY'S TIMETABLE
      </h3>
      <div className="space-y-2">
        {schedule.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-white/40">{item.time}</span>
              <span className="text-white font-medium">{item.subject}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[item.status]}`}>
              {item.status === "done" && "✓ Done"}
              {item.status === "now" && "Now"}
              {item.status === "soon" && "Soon"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
