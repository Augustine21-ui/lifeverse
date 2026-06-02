import { Zap } from "lucide-react";

const resources = {
  Mathematics: [
    { title: "Intro to Quadratic Equations", type: "Lecture", duration: "24 min", xp: 40 },
    { title: "Algebra Fundamentals", type: "Exercise", duration: "30 min", xp: 60 },
  ],
  Biology: [
    { title: "Cell Biology Summary Notes", type: "Study Guide", duration: "15 min read", xp: 25 },
    { title: "DNA Replication", type: "Video", duration: "12 min", xp: 35 },
  ],
};

export default function ResourceList({ subject }) {
  const items = resources[subject] || [];
  if (items.length === 0)
    return <p className="text-white/40 text-sm">No resources for this subject.</p>;

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
        {subject.toUpperCase()} — RESOURCES
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="card p-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-xs text-white/40">
                {item.type} • {item.duration}
              </p>
            </div>
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Zap size={14} />
              <span>+{item.xp} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
