
const universities = [];


const generateId = () => Math.random().toString(36).substring(2, 10);


const createUniversity = (universityData) => {
  const { name, location, established, courses } = universityData;

  if (!name || !location || !established) {
    throw new Error('Name, location, and established year are required.');
  }

  const currentYear = new Date().getFullYear();
  if (established <= 1000 || established > currentYear) {
    throw new Error('Established year must be between 1001 and the current year.');
  }

  const university = {
    id: generateId(),
    name: name.trim(),
    location: location.trim(),
    established,
    courses: courses || [], 
  };

  universities.push(university);
  return university;
};

/**
 * Get a university by ID.
 * @param {string} id - The university ID.
 * @returns {Object} - The university.
 */
const getUniversityById = (id) => {
  const university = universities.find(u => u.id === id);
  if (!university) {
    throw new Error('University not found.');
  }
  return university;
};
// Seed sample universities
app.post('/api/universities/seed', (req, res) => {
  universities.length = 0; // Clear existing universities
  const sampleUniversities = [
    { id: generateId(), name: 'Nairobi University', location: 'Nairobi, NU', ranking: 1 },
    { id: generateId(), name: 'Tom mboya University', location: 'Homabay, TMU', ranking: 2 },
    { id: generateId(), name: 'Kibabii University', location: 'Bungoma, KB', ranking: 3 },
    { id: generateId(), name: 'University Eldored', location: 'Eldored, ue', ranking: 4 },
    { id: generateId(), name: 'Kenyatta University', location: 'Nairobi, UK', ranking: 5 },
  ];
  universities.push(...sampleUniversities);
  res.status(201).json({ message: 'Sample universities created', universities });
});

/**
 * Update a university.
 * @param {string} id - The university ID.
 * @param {Object} updates - Updates for the university.
 * @returns {Object} - The updated university.
 */
const updateUniversity = (id, updates) => {
  const university = getUniversityById(id);

  if (updates.established) {
    const currentYear = new Date().getFullYear();
    if (updates.established <= 1000 || updates.established > currentYear) {
      throw new Error('Established year must be between 1001 and the current year.');
    }
  }

  Object.assign(university, updates);
  return university;
};

/**
 * Delete a university.
 * @param {string} id - The university ID.
 * @returns {Object} - The deleted university.
 */
const deleteUniversity = (id) => {
  const index = universities.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error('University not found.');
  }
  return universities.splice(index, 1)[0];
};

/**
 * Add a course to a university.
 * @param {string} universityId - The university ID.
 * @param {string} courseId - The course ID.
 */
const addCourseToUniversity = (universityId, courseId) => {
  const university = getUniversityById(universityId);
  if (!university.courses.includes(courseId)) {
    university.courses.push(courseId);
  }
};

// Exporting the in-memory storage and utility functions
module.exports = {
  universities,
  createUniversity,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  addCourseToUniversity,
};
