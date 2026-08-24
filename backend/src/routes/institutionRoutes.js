import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireInstitutionAdmin } from '../middleware/requireInstitutionAdmin.js';
import * as institutionController from '../controllers/institutionController.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student StudySphere (any authenticated user)
router.get('/studysphere', institutionController.getStudentStudySphere);

// Institution admin routes
router.use(requireInstitutionAdmin);

// Dashboard
router.get('/dashboard', institutionController.getDashboard);
router.put('/students/group', institutionController.updateStudentGroup);

// Groups
router.post('/groups', institutionController.createGroup);
router.put('/groups/:id', institutionController.updateGroup);
router.delete('/groups/:id', institutionController.deleteGroup);

// Timetable
router.post('/timetable', institutionController.createTimetableEntry);
router.post('/timetable/upload', upload.single('file'), institutionController.uploadTimetableCSV);
router.get('/timetable/group/:groupId', institutionController.getTimetableByGroup);

// Resources
router.post('/resources', institutionController.createResource);
router.get('/resources/:targetType/:targetId', institutionController.getResources);

// Announcements
router.post('/announcements', institutionController.createAnnouncement);
router.get('/announcements', institutionController.getAnnouncements);

// Teacher assignments
router.post('/assign', institutionController.assignTeacher);
router.delete('/assign/:teacherId/:academicGroupId', institutionController.removeTeacherAssignment);
router.get('/hierarchy', institutionController.getHierarchy);
router.get('/student-subjects', institutionController.getStudentSubjects);

export default router;