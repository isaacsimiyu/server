const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uems',
});

// Connect to the database and create tables automatically
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');

  // Automatically create tables
  createTables();
});

// Function to create tables if they don't exist
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

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  db.query(createUsersTable, (err, result) => {
    if (err) {
      console.error('Error creating users table:', err.stack);
    } else {
      console.log('Users table created or already exists.');
    }
  });

  db.query(createMessagesTable, (err, result) => {
    if (err) {
      console.error('Error creating messages table:', err.stack);
    } else {
      console.log('Messages table created or already exists.');
    }
  });
};

// Helper: Validate phone number using a regex
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phone);
};

// Signup route
app.post('/signup', (req, res) => {
  const { userNameOrEmail, password, phone } = req.body;

  // Validate input fields
  if (!userNameOrEmail || !password || !phone) {
    return res.status(400).json({ msg: 'All fields are required (username/email, password, phone).' });
  }

  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ msg: 'Invalid phone number format.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10); // Hash password
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userNameOrEmail); // Determine if input is email
  const field = isEmail ? 'email' : 'username';

  // Insert user into the database
  db.query(
    `INSERT INTO users (${field}, password, phone) VALUES (?, ?, ?)`,
    [userNameOrEmail, passwordHash, phone],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ msg: 'Username, Email, or Phone number already exists.' });
        }
        return res.status(500).json({ msg: 'Server error' });
      }
      res.json({ msg: 'User registered successfully' });
    }
  );
});

// Signin route
app.post('/signin', (req, res) => {
  const { userNameOrEmail, password } = req.body;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userNameOrEmail);
  const field = isEmail ? 'email' : 'username';

  db.query(`SELECT * FROM users WHERE ${field} = ?`, [userNameOrEmail], (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ msg: 'Server error' });
        if (isMatch) {
          const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
          res.json({ token });
        } else {
          res.status(400).json({ msg: 'Invalid credentials' });
        }
      });
    } else {
      res.status(400).json({ msg: 'User not found' });
    }
  });
});

// Contact route (example)
app.post('/api/contact', (req, res) => {
  const { email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.CONTACT_EMAIL,
    subject: 'New Contact Message',
    text: `Message from: ${email}\n\n${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('Email sent successfully');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
