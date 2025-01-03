const express = require('express'); 
const app = express();


const courses = [];


const generateId = () => Math.random().toString(36).substring(2, 10);


const validateCourse = (name, description, cutoff) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Name is required and must be a non-empty string');
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    throw new Error('Description is required and must be a non-empty string');
  }
  if (typeof cutoff !== 'number' || cutoff < 0 || cutoff > 100) {
    throw new Error('Cutoff must be a number between 0 and 100');
  }
};


const createCourse = (name, description, cutoff) => {
  validateCourse(name, description, cutoff);

  if (courses.some(course => course.name.toLowerCase() === name.trim().toLowerCase())) {
    throw new Error('Course name must be unique');
  }

  const course = {
    id: generateId(),
    name: name.trim(),
    description: description.trim(),
    cutoff,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  courses.push(course);
  return course;
};

const getCourseById = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Course ID is required and must be a string');
  }
  return courses.find(course => course.id === id) || null;
};

const updateCourse = (id, updates) => {
  const course = getCourseById(id);
  if (!course) {
    throw new Error('Course not found');
  }

  if (updates.name) {
    if (courses.some(c => c.name.toLowerCase() === updates.name.trim().toLowerCase() && c.id !== id)) {
      throw new Error('Course name must be unique');
    }
    course.name = updates.name.trim();
  }
  if (updates.description) {
    course.description = updates.description.trim();
  }
  if (updates.cutoff !== undefined) {
    if (typeof updates.cutoff !== 'number' || updates.cutoff < 0 || updates.cutoff > 100) {
      throw new Error('Cutoff must be a number between 0 and 100');
    }
    course.cutoff = updates.cutoff;
  }

  course.updatedAt = new Date();
  return course;
};

const deleteCourse = (id) => {
  const index = courses.findIndex(course => course.id === id);
  if (index === -1) {
    throw new Error('Course not found');
  }
  return courses.splice(index, 1)[0];
};

const getCourseSummary = (id) => {
  const course = getCourseById(id);
  if (!course) {
    throw new Error('Course not found');
  }
  return `${course.name}: ${course.description}`;
};

// Seed sample courses
app.post('/api/courses/seed', (req, res) => {
  try {
    courses.length = 0; // Clear existing courses

    const sampleCourses = [
      { name: 'Computer Science', description: 'Study of computation, programming, and algorithms.', cutoff: 60 },
      { name: 'Networking', description: 'Study of computer networks and communication systems.', cutoff: 65 },
      { name: 'Mathematical Science', description: 'Study of advanced mathematics and applications.', cutoff: 70 },
      { name: 'Education Science', description: 'Study of teaching methods and educational systems.', cutoff: 55 },
      { name: 'Actuarial Science', description: 'Study of risk analysis and financial mathematics.', cutoff: 75 },
      { name: 'Introduction to Programming', description: 'Learn the basics of programming with Python.', cutoff: 70 },
      { name: 'Data Structures and Algorithms', description: 'Master the key data structures and algorithms for efficient coding.', cutoff: 80 },
      { name: 'Artificial Intelligence', description: 'Explore AI concepts and build intelligent systems.', cutoff: 90 },
      { name: 'Web Development', description: 'Build modern web applications using HTML, CSS, and JavaScript.', cutoff: 75 },
      { name: 'Database Management', description: 'Understand relational databases and SQL.', cutoff: 65 },
    ];

    // Add unique sample courses
    sampleCourses.forEach(({ name, description, cutoff }) => {
      try {
        createCourse(name, description, cutoff);
      } catch (error) {
        console.warn(`Skipped duplicate course: ${name}`);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sample courses created successfully',
      totalCourses: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error occurred while seeding courses',
      error: error.message,
    });
  }
});

// Exporting the in-memory storage and functions
module.exports = {
  courses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseSummary,
};
