const express = require('express');
const router = express.Router();

// In-memory storage for course applications and courses
const applications = [];
const courses = []; // Simulated course data for validation

// Utility function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

/**
 * Apply for a course
 */
router.post('/', (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ message: 'studentId and courseId are required' });
  }

  // Validate course existence
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // Prevent duplicate applications
  const existingApplication = applications.find(
    app => app.studentId === studentId && app.courseId === courseId
  );
  if (existingApplication) {
    return res.status(400).json({ message: 'Application already exists for this course.' });
  }

  // Create new application
  const application = { id: generateId(), studentId, courseId, createdAt: new Date() };
  applications.push(application);

  res.status(201).json({
    message: 'Application submitted successfully.',
    application,
  });
});

/**
 * Get all applications
 */
router.get('/', (req, res) => {
  // Populate course details
  const populatedApplications = applications.map(app => ({
    ...app,
    course: courses.find(c => c.id === app.courseId),
  }));

  res.status(200).json(populatedApplications);
});

/**
 * Get applications by student ID
 */
router.get('/student/:studentId', (req, res) => {
  const { studentId } = req.params;

  // Filter applications by student ID
  const studentApplications = applications.filter(app => app.studentId === studentId);

  if (studentApplications.length === 0) {
    return res.status(404).json({ message: 'No applications found for this student.' });
  }

  // Populate course details
  const populatedApplications = studentApplications.map(app => ({
    ...app,
    course: courses.find(c => c.id === app.courseId),
  }));

  res.status(200).json(populatedApplications);
});

/**
 * Delete an application
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const index = applications.findIndex(app => app.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  const deletedApplication = applications.splice(index, 1)[0];
  res.status(200).json({
    message: 'Application deleted successfully.',
    application: deletedApplication,
  });
});

module.exports = router;
