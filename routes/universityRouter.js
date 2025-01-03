const express = require('express');
const router = express.Router();

// In-memory storage for universities
const universities = [];

/**
 * Seed sample universities.
 */
router.post('/seed', (req, res) => {
  const sampleUniversities = [
    { id: 'u1', name: 'Tom Mboya University', location: 'Homabay, HB' },
    { id: 'u2', name: 'Nairobi University', location: 'Nairobi, N' },
    { id: 'u3', name: 'Maseno University', location: 'Kisumu, KUS' },
    { id: 'u4', name: 'Kibabii University', location: 'Bungoma, BG' },
  ];

  try {
    // Clear existing universities
    universities.length = 0;

    // Add sample universities to the in-memory array
    universities.push(...sampleUniversities);

    res.status(201).json({
      message: 'Sample universities created successfully.',
      totalUniversities: universities.length,
      universities,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error occurred while seeding universities.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
