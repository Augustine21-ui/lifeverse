import React from 'react';
import ActiveStudyGroups from '../components/groups/ActiveStudyGroups';
import { Link } from 'react-router-dom';

export default function StudyGroupsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Study Groups</h1>
        <Link to="/dashboard" className="text-brand-400 hover:underline">← Back to Dashboard</Link>
      </div>
      <div className="card p-6">
        <ActiveStudyGroups />
      </div>
    </div>
  );
}