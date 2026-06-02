const subjects = ["Mathematics", "Biology", "Chemistry", "Physics", "History"];

export default function SubjectList({ selectedSubject, onSelectSubject }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
        SUBJECTS
      </h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedSubject === subject
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            {subject}
          </button>
        ))}
      </div>
    </div>
  );
}
