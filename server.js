const express = require('express');
const validator = require('validator');
const mysql = require('mysql2');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const crypto = require('crypto');
require('dotenv').config();




const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3500;




app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(bodyParser.json());


const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uems',
  connectionLimit: 10,
});


db.getConnection((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('Connected to database.');
  createTables();
});


const createTables = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(15) UNIQUE,
      google_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createcontactsTable = `
    CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

  `;

  const createPasswordResetTable = `
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
 

  const createCoursesTable = `
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      cutoff INT NOT NULL CHECK (cutoff BETWEEN 0 AND 100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createUniversitiesTable = `
    CREATE TABLE IF NOT EXISTS universities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      location VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createApplicationsTable = `
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      university_id INT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     
    );
  `;
  const createStudentTable = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    id_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    index_number VARCHAR(20) NOT NULL UNIQUE,
    year_of_kcse YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;


  db.query(createUsersTable, (err) => {
    if (err) console.error('Error creating users table:', err.stack);
    else console.log('Users table created or already exists.');
  });

  db.query(createcontactsTable, (err) => {
    if (err) console.error('Error creating messages table:', err.stack);
    else console.log('Messages table created or already exists.');
  });

  db.query(createPasswordResetTable, (err) => {
    if (err) console.error('Error creating password_resets table:', err.stack);
    else console.log('Password resets table ready.');
  });
  db.query(createCoursesTable, (err) => {
    if (err) console.error('Error creating courses table:', err.stack);
    else console.log('Courses table created or already exists.');
  });

  db.query(createUniversitiesTable, (err) => {
    if (err) console.error('Error creating universities table:', err.stack);
    else console.log('Universities table created or already exists.');
  });

  db.query(createStudentTable, (err) => {
    if (err) console.error('Error creating students table:', err.stack);
    else console.log('Students table created or already exists.');
  });

  db.query(createApplicationsTable, (err) => {
    if (err) console.error('Error creating applications table:', err.stack);
    else console.log('Applications table created or already exists.');
  });
  

};


const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};


app.post('/signup', (req, res) => {
  const { userNameOrEmail, password, phone } = req.body;

  if (!userNameOrEmail || !password || !phone) {
    return res.status(400).json({ msg: 'All fields are required (username/email, password, phone).' });
  }

  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ msg: 'Invalid phone number format.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userNameOrEmail);
  const field = isEmail ? 'email' : 'username';

  db.query(
    `INSERT INTO users (${field}, password, phone) VALUES (?, ?, ?)`,
    [userNameOrEmail, passwordHash, phone],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ msg: 'Username, Email, or Phone number already exists.' });
        }
        console.error('Error during sign-up:', err);
        return res.status(500).json({ msg: 'Server error' });
      }
      res.json({ msg: 'User registered successfully' });
    }
  );
});


app.post('/signin', (req, res) => {
  const { userNameOrEmail, password } = req.body;
  const isEmail = /^[^\s@]+@[^\s@]+$/.test(userNameOrEmail);
  const field = isEmail ? 'email' : 'username';

  db.query(`SELECT * FROM users WHERE ${field} = ?`, [userNameOrEmail], (err, results) => {
    if (err) {
      console.error('Database error during sign-in:', err);
      return res.status(500).json({ msg: 'Server error' });
    }

    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ msg: 'Server error' });
        }
        if (isMatch) {
          res.status(200).json({ msg: 'Login successfully' });
        } else {
          res.status(400).json({ msg: 'Invalid username/email or password' });
        }
      });
    } else {
      res.status(400).json({ msg: 'Invalid username/email or password' });
    }
  });
});


app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ msg: 'Invalid email format' });
  }

  try {
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({ msg: 'No user found with that email address' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await db.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, hashedToken, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_isaacsimiyu757,
        pass: process.env.EMAIL_Isaac3819,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_isaacsimiyu757,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error during forgot-password:', error.message);
    res.status(500).json({ msg: 'An error occurred. Please try again later.' });
  }
});



app.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  db.query(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
    [token],
    (err, results) => {
      if (err) {
        console.error('Database error during reset-password:', err);
        return res.status(500).json({ msg: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ msg: 'Invalid or expired token' });
      }

      const email = results[0].email;
      const passwordHash = bcrypt.hashSync(newPassword, 10);

      db.query('UPDATE users SET password = ? WHERE email = ?', [passwordHash, email], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ msg: 'Error updating password' });
        }

        db.query('DELETE FROM password_resets WHERE email = ?', [email], (err) => {
          if (err) console.error('Error deleting token:', err.stack);
        });

        res.status(200).json({ msg: 'Password has been reset successfully' });
      });
    }
  );
});


app.post('/api/students', (req, res) => {
  const { firstName, surname, idNumber, email, indexNumber, yearOfKCSE } = req.body;

  if (!firstName || !surname || !idNumber || !email || !indexNumber || !yearOfKCSE) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const query = `
    INSERT INTO students (firstname, surname, id_number, email, index_number, year_of_kcse)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [firstName, surname, idNumber, email, indexNumber, yearOfKCSE], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Duplicate entry detected.' });
      }
      console.error('Error inserting student data:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    res.status(201).json({ success: true, studentId: results.insertId });
  });
});


app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: "A valid email is required." });
  }
  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  db.query(
    "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
    [name, email, message],
    (err) => {
      if (err) {
        console.error("Error inserting data into the 'Messages' table:", err);
        return res.status(500).json({ message: "Failed to submit the message." });
      }
      sendThankYouEmail(name, email);
      res.status(200).json({ message: "Message sent successfully." });
    }
  );
});


// Send a thank-you email to the user
const sendThankYouEmail = (name, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "isaacsimiyu757@gmail.com",
      pass: "phyxvlhpzjymbrtr",
    },
  });

  const mailOptions = {
    from: "isaacsimiyu757@gmail.com",
    to: email,
    subject: "Thank You for Contacting UEMS",
    text: `Hello ${name},\n\nThank you for contacting UEMS. We have received your message and will respond shortly.\n\nBest regards, UEMS`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending thank-you email:", error);
    } else {
      console.log("Thank-you email sent:", info.response);
    }
  });
};






const courses = [];
const applications = [];
const universities = [];

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// Competency structure
const seedCourses = () => {
  const sampleCourses = [
    {
      id: generateId(),
      name: 'Computer Science',
      description: 'Study of computation, programming, and algorithms.',
      cutoff: 60,
      competencies: ['Programming', 'Data Structures', 'Algorithms'], // CBC-aligned
      prerequisites: [],
    },
    {
      id: generateId(),
      name: 'Mathematics',
      description: 'Advanced mathematical concepts and problem-solving.',
      cutoff: 70,
      competencies: ['Linear Algebra', 'Calculus', 'Probability'],
      prerequisites: [],
    },
    {
      id: generateId(),
      name: 'Web Development',
      description: 'Building modern web applications.',
      cutoff: 75,
      competencies: ['HTML/CSS', 'JavaScript', 'Web Frameworks'],
      prerequisites: ['Programming'], // Requires a competency in "Programming"
    },
  ];

  sampleCourses.forEach(({ id, name, description, cutoff, competencies, prerequisites }) => {
    db.query(
      'INSERT INTO courses (id, name, description, cutoff, competencies, prerequisites) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [id, name, description, cutoff, JSON.stringify(competencies), JSON.stringify(prerequisites)],
      (err) => {
        if (err) console.error(`Error seeding course "${name}":`, err);
      }
    );
  });
};

const seedUniversities = () => {
  const sampleUniversities = [
    {
      id: generateId(),
      name: 'Tom Mboya University',
      location: 'Homabay, HB',
      programs: ['Computer Science', 'Mathematics'], // Programs offered
    },
    {
      id: generateId(),
      name: 'Nairobi University',
      location: 'Nairobi, N',
      programs: ['Web Development', 'Engineering'],
    },
    {
      id: generateId(),
      name: 'Maseno University',
      location: 'Kisumu, KUS',
      programs: ['Computer Science', 'Mathematics'],
    },
    {
      id: generateId(),
      name: 'Kibabii University',
      location: 'Bungoma, BG',
      programs: ['Mathematics', 'Physics'],
    },
  ];

  sampleUniversities.forEach(({ id, name, location, programs }) => {
    db.query(
      'INSERT INTO universities (id, name, location, programs) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
      [id, name, location, JSON.stringify(programs)],
      (err) => {
        if (err) console.error(`Error seeding university "${name}":`, err);
      }
    );
  });
};

// Abstract seeding logic for reusability
const seedData = (tableName, data) => {
  data.forEach((entry) => {
    const columns = Object.keys(entry).join(', ');
    const placeholders = Object.keys(entry).map(() => '?').join(', ');
    const values = Object.values(entry);

    db.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id = id`,
      values,
      (err) => {
        if (err) console.error(`Error seeding ${tableName}:`, err);
      }
    );
  });
};

// Seed data
seedData('courses', [
  {
    id: generateId(),
    name: 'Computer Science',
    description: 'Study of computation, programming, and algorithms.',
    cutoff: 60,
    competencies: JSON.stringify(['Programming', 'Data Structures', 'Algorithms']),
    prerequisites: JSON.stringify([]),
  },
]);

seedData('universities', [
  {
    id: generateId(),
    name: 'Tom Mboya University',
    location: 'Homabay, HB',
    programs: JSON.stringify(['Computer Science', 'Mathematics']),
  },
]);





app.get('/api/courses', (req, res) => {
  db.query('SELECT * FROM courses', (err, results) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.status(200).json({ success: true, courses: results });
  });
});



app.post('/api/courses', (req, res) => {
  const { name, description, cutoff } = req.body;

  if (!name || !description || cutoff === undefined) {
    return res.status(400).json({ success: false, message: 'Name, description, and cutoff are required' });
  }

  if (cutoff < 0 || cutoff > 100) {
    return res.status(400).json({ success: false, message: 'Cutoff must be between 0 and 100' });
  }

  db.query(
    'INSERT INTO courses (name, description, cutoff) VALUES (?, ?, ?)',
    [name.trim(), description.trim(), cutoff],
    (err, results) => {
      if (err) {
        console.error('Error adding course:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Course name must be unique' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.status(201).json({ success: true, courseId: results.insertId });
    }
  );
});

app.put('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, cutoff } = req.body;

  db.query(
    'UPDATE courses SET name = ?, description = ?, cutoff = ?, updated_at = NOW() WHERE id = ?',
    [name, description, cutoff, id],
    (err, results) => {
      if (err) {
        console.error('Error updating course:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      res.status(200).json({ success: true, message: 'Course updated successfully' });
    }
  );
});


app.put('/api/courses/:id/cutoff', (req, res) => {
  const { id } = req.params;
  const { cutoff } = req.body;

  if (cutoff === undefined || cutoff < 0 || cutoff > 100) {
    return res.status(400).json({ success: false, message: 'Cutoff must be between 0 and 100' });
  }

  const course = courses.find(course => course.id === id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  course.cutoff = cutoff;
  res.status(200).json({ success: true, course });
});


app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const index = courses.findIndex(course => course.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  courses.splice(index, 1);
  res.status(200).json({ success: true, message: 'Course deleted successfully' });
});







app.get('/api/universities', (req, res) => {
  db.query('SELECT * FROM universities', (err, results) => {
    if (err) {
      console.error('Error fetching universities:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.status(200).json({ success: true, universities: results });
  });
});



app.post('/api/universities', (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ success: false, message: 'Name and location are required.' });
  }

  db.query(
    'INSERT INTO universities (name, location) VALUES (?, ?)',
    [name.trim(), location.trim()],
    (err, results) => {
      if (err) {
        console.error('Error adding university:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'University name must be unique.' });
        }
        return res.status(500).json({ success: false, message: 'Database error.' });
      }
      res.status(201).json({ success: true, universityId: results.insertId });
    }
  );
});
app.delete('/api/universities/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM universities WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error deleting university:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'University not found.' });
    }
    res.status(200).json({ success: true, message: 'University deleted successfully.' });
  });
});


app.get('/api/applications', (req, res) => {
  const { studentId, courseId, universityId } = req.query;

  
  let query = `
    SELECT a.id, 
           s.name AS student_name, 
           c.name AS course_name, 
           u.name AS university_name, 
           a.applied_at
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN courses c ON a.course_id = c.id
    JOIN universities u ON a.university_id = u.id
  `;

 
  const conditions = [];
  const params = [];

  if (studentId) {
    conditions.push('a.student_id = ?');
    params.push(studentId);
  }

  if (courseId) {
    conditions.push('a.course_id = ?');
    params.push(courseId);
  }

  if (universityId) {
    conditions.push('a.university_id = ?');
    params.push(universityId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching applications:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.status(200).json({ success: true, applications: results });
  });
});



app.post('/api/applications', (req, res) => {
  const { studentId, courseId, universityId } = req.body;

  if (!studentId || !courseId || !universityId) {
    return res.status(400).json({ success: false, message: 'Student ID, Course ID, and University ID are required' });
  }

  db.query(
    'INSERT INTO applications (student_id, course_id, university_id) VALUES (?, ?, ?)',
    [studentId, courseId, universityId],
    (err, results) => {
      if (err) {
        console.error('Error creating application:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.status(201).json({ success: true, applicationId: results.insertId });
    }
  );
});




app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = router;
