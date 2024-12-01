const express = require('express');
const Course = require('../models/Course');
const router = express.Router();

// GET /api/courses: Fetch all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
});

// POST /api/courses: Add a new course
router.post('/', async (req, res) => {
  const { name, cutoff } = req.body;

  if (!name || cutoff === undefined) {
    return res.status(400).json({ message: 'Course name and cutoff are required' });
  }

  try {
    const newCourse = new Course({ name, cutoff });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: 'Error adding course', error });
  }
});

// PUT /api/programs/:programId/cutoff: Update the cutoff point for a course
router.put('/:programId/cutoff', async (req, res) => {
  const { programId } = req.params;
  const { cutoff } = req.body;

  if (cutoff === undefined) {
    return res.status(400).json({ message: 'Cutoff is required' });
  }

  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      programId,
      { cutoff },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cutoff', error });
  }
});

module.exports = router;
