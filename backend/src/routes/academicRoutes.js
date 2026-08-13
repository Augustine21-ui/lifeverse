import express from 'express';
import {
  getCountries, getInstitutions, getCurricula, saveAcademicInfo, getAcademicInfo,
  getSubjects, getTopics, uploadMaterial, getMaterials,
  createAssignment, getAssignments, getTimetable
} from '../controllers/academicController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Onboarding
router.get('/countries', authenticate, getCountries);
router.get('/institutions', authenticate, getInstitutions);
router.get('/curricula', authenticate, getCurricula);
router.get('/academic-info', authenticate, getAcademicInfo);
router.post('/academic-info', authenticate, saveAcademicInfo);

// Subjects & Topics
router.get('/subjects', authenticate, getSubjects);
router.get('/topics', authenticate, getTopics);

// Materials
router.post('/materials', authenticate, uploadMaterial);
router.get('/materials', authenticate, getMaterials);

// Assignments
router.post('/assignments', authenticate, createAssignment);
router.get('/assignments', authenticate, getAssignments);

// Timetable
router.get('/timetable', authenticate, getTimetable);

export default router;