const { applications, createApplication, findApplication, deleteApplication } = require('./courseApplicationModel');

// Apply for a course route
app.post('/api/applications', (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ message: 'studentId and courseId are required' });
  }

  const existingApplication = findApplication(studentId, courseId);
  if (existingApplication) {
    return res.status(400).json({ message: 'Application already exists for this course.' });
  }

  const newApplication = createApplication(studentId, courseId);
  res.status(201).json({ message: 'Application submitted successfully.', application: newApplication });
});

