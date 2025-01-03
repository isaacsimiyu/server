const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  createCourse,
  courses,
  deleteCourse,
  getCourseById,
  updateCourse,
  getCourseSummary,
} = require('./Course'); // Import functions from Course.js
const router = express.Router();

/**
 * Middleware for validation error handling
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * Seed sample courses
 */
router.post('/seed', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Seeding is not allowed in production.' });
  }

  const sampleCourses = [
    { name: 'Computer Science', description: 'Study of computation and algorithms.', cutoff: 85, universityId: '6475' },
    { name: 'Mathematics', description: 'Exploration of advanced mathematical concepts.', cutoff: 80, universityId: '6465' },
    { name: 'Data Science', description: 'Analysis of data to uncover insights.', cutoff: 90, universityId: '6445' },
    { name: 'Physics', description: 'Study of matter and its motion.', cutoff: 75, universityId: '6444' },
    { name: 'Introduction to Programming', description: 'Learn the basics of programming with Python.', cutoff: 70, universityId: '6484' },
    { name: 'Data Structures and Algorithms', description: 'Master the key data structures and algorithms for efficient coding.', cutoff: 80, universityId: '6455' },
    { name: 'Artificial Intelligence', description: 'Explore AI concepts and build intelligent systems.', cutoff: 90, universityId: '6455' },
    { name: 'Web Development', description: 'Build modern web applications using HTML, CSS, and JavaScript.', cutoff: 75, universityId: '6485' },
    { name: 'Database Management', description: 'Understand relational databases and SQL.', cutoff: 65, universityId: '6489' },
  ];

  try {
    courses.length = 0; // Clear existing courses
    sampleCourses.forEach((course) => {
      createCourse(course.name, course.description, course.cutoff);
    });

    res.status(201).json({
      success: true,
      message: 'Sample courses created successfully.',
      totalCourses: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error occurred while seeding courses.',
      error: error.message,
    });
  }
});

/**
 * GET all courses
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    totalCourses: courses.length,
    courses,
  });
});

/**
 * GET a specific course by ID
 */
router.get('/:id',
  param('id').isString().withMessage('Course ID must be a string.'),
  handleValidationErrors,
  (req, res) => {
    try {
      const course = getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found.' });
      }
      res.status(200).json({ success: true, course });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error occurred while fetching the course.',
        error: error.message,
      });
    }
  }
);

/**
 * POST a new course
 */
router.post('/',
  [
    body('name').isString().notEmpty().withMessage('Name is required and must be a string.'),
    body('description').isString().notEmpty().withMessage('Description is required and must be a string.'),
    body('cutoff').isInt({ min: 0, max: 100 }).withMessage('Cutoff must be an integer between 0 and 100.'),
  ],
  handleValidationErrors,
  (req, res) => {
    const { name, description, cutoff } = req.body;

    try {
      const newCourse = createCourse(name, description, cutoff);
      res.status(201).json({ success: true, message: 'Course created successfully.', course: newCourse });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error occurred while creating the course.',
        error: error.message,
      });
    }
  }
);

/**
 * PUT to update a course
 */
router.put('/:id',
  [
    param('id').isString().withMessage('Course ID must be a string.'),
    body('name').optional().isString().withMessage('Name must be a string.'),
    body('description').optional().isString().withMessage('Description must be a string.'),
    body('cutoff').optional().isInt({ min: 0, max: 100 }).withMessage('Cutoff must be an integer between 0 and 100.'),
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const updatedCourse = updateCourse(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Course updated successfully.', course: updatedCourse });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error occurred while updating the course.',
        error: error.message,
      });
    }
  }
);

/**
 * DELETE a course
 */
router.delete('/:id',
  param('id').isString().withMessage('Course ID must be a string.'),
  handleValidationErrors,
  (req, res) => {
    try {
      const deletedCourse = deleteCourse(req.params.id);
      res.status(200).json({ success: true, message: 'Course deleted successfully.', course: deletedCourse });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Error occurred while deleting the course.',
        error: error.message,
      });
    }
  }
);

/**
 * GET course summary
 */
router.get('/:id/summary',
  param('id').isString().withMessage('Course ID must be a string.'),
  handleValidationErrors,
  (req, res) => {
    try {
      const summary = getCourseSummary(req.params.id);
      res.status(200).json({ success: true, summary });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Error occurred while fetching course summary.',
        error: error.message,
      });
    }
  }
);

module.exports = router;
