// scripts/seedDemo.cjs
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models – adjust paths if needed
const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const OrbitSession = require('../models/OrbitSession');
const Post = require('../models/Post');
const Timetable = require('../models/Timetable');
const Opportunity = require('../models/Opportunity');

const DEMO_USER = {
  username: 'demo_user',
  email: 'demo@lifeverse.com',
  password: 'Demo123!',
  full_name: 'Alex Taylor',
  xp: 1250,
  level: 3,
  streak_days: 7,
  mood: 'happy',
  moodPercent: 85,
  date_of_birth: new Date('2005-05-15'),
  education_level: 'bachelors',
  skills: ['JavaScript', 'React', 'Data Analysis', 'Communication'],
  institution_subscription_valid: true,
};

async function seedDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing demo user
    await User.deleteOne({ email: DEMO_USER.email });

    // Create user
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
    const user = new User({ ...DEMO_USER, password: hashedPassword });
    await user.save();
    console.log(`✅ Demo user created: ${user.username} (${user.email})`);

    // Tasks
    const tasks = [
      { title: 'Complete React module', xp_reward: 50, is_completed: true },
      { title: 'Practice algorithms', xp_reward: 30, is_completed: false },
      { title: 'Review Orbit lesson', xp_reward: 20, is_completed: false },
      { title: 'Prepare for study group', xp_reward: 40, is_completed: false },
    ];
    for (const t of tasks) {
      await Task.create({
        user: user._id,
        title: t.title,
        xp_reward: t.xp_reward,
        is_completed: t.is_completed,
        due_date: t.is_completed ? new Date() : new Date(Date.now() + 86400000 * 2),
      });
    }
    console.log(`✅ ${tasks.length} tasks created`);

    // Focus sessions (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const duration = [15, 25, 30, 45][Math.floor(Math.random() * 4)];
      await FocusSession.create({
        user: user._id,
        duration,
        start_time: new Date(date.setHours(10, 0, 0, 0)),
        end_time: new Date(date.setHours(10 + duration / 60, 0, 0, 0)),
        completed: true,
      });
    }
    console.log('✅ Focus sessions created');

    // Orbit sessions
    const orbitTopics = ['Cortex', 'CluePath', 'Pathfinder', 'Reflex'];
    for (const topic of orbitTopics) {
      await OrbitSession.create({
        user: user._id,
        topic,
        status: 'completed',
        completed_at: new Date(),
        score: Math.floor(Math.random() * 30) + 70,
      });
    }
    console.log('✅ Orbit sessions created');

    // Social posts
    const posts = [
      {
        user: user._id,
        content: 'Looking for a study partner for Algorithms and Data Structures. Anyone interested?',
        location: 'Mumbai',
        time_ago: '1w ago',
        questions: 2,
        stars: 1,
      },
      {
        user: user._id,
        content: 'Just completed a 25-min focus session! Feeling productive 💪',
        location: 'Global',
        time_ago: '2d ago',
        questions: 0,
        stars: 3,
      },
    ];
    for (const p of posts) {
      await Post.create(p);
    }
    console.log('✅ Social posts created');

    // Timetable
    const timetableEntries = [
      { day_of_week: 1, subject_name: 'Maths', start_time: '09:00', end_time: '10:30' },
      { day_of_week: 1, subject_name: 'Physics', start_time: '11:00', end_time: '12:30' },
      { day_of_week: 2, subject_name: 'Chemistry', start_time: '09:00', end_time: '10:30' },
      { day_of_week: 3, subject_name: 'History', start_time: '14:00', end_time: '15:30' },
      { day_of_week: 4, subject_name: 'Biology', start_time: '10:00', end_time: '11:30' },
      { day_of_week: 5, subject_name: 'English', start_time: '13:00', end_time: '14:30' },
    ];
    for (const entry of timetableEntries) {
      await Timetable.create({ user: user._id, ...entry });
    }
    console.log('✅ Timetable created');

    // Opportunities
    const opportunities = [
      {
        title: 'Junior Software Developer',
        company: 'TechHub Kenya',
        description: 'Build web applications for African startups.',
        age_min: 18,
        age_max: 28,
        skills_required: ['JavaScript', 'React', 'Node.js'],
        education_level: 'bachelors',
        link: 'https://techhub.ke/careers',
      },
      {
        title: 'Data Science Intern',
        company: 'AI for Africa',
        description: 'Analyze agricultural data using machine learning.',
        age_min: 20,
        age_max: 26,
        skills_required: ['Python', 'Pandas', 'Machine Learning'],
        education_level: 'masters',
        link: 'https://aiforafrica.com/internships',
      },
    ];
    for (const opp of opportunities) {
      await Opportunity.create(opp);
    }
    console.log('✅ Opportunities created');

    console.log('🎉 Demo seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDemo();