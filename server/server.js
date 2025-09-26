// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add the missing notification counts route
app.get('/api/notifications/counts', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Get current user from query parameters or headers (you'll need to implement auth)
    const userIdentifier = req.query.userId || 'default'; // You'll need to get this from JWT

    // For now, we'll return counts for both user and admin
    const userNotificationsCount = await db.collection('notifications')
      .countDocuments({
        $or: [
          { userId: userIdentifier, forUser: true, read: false },
          { forAdmin: true, read: false } // Admin sees all admin notifications
        ]
      });

    const quizCompletedCount = await db.collection('quiz_results')
      .countDocuments({ status: 'completed', readByAdmin: false });

    res.json({
      success: true,
      counts: {
        quizScores: userNotificationsCount,
        courseRemarks: 0,
        generalCourses: 0,
        masterclassCourses: 0,
        importantInfo: 0,
        adminMessages: 0,
        quizCompleted: quizCompletedCount, // This is for admin
        courseCompleted: 0
      },
      user: userIdentifier
    });
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    res.json({
      success: true,
      counts: {
        quizScores: 0,
        courseRemarks: 0,
        generalCourses: 0,
        masterclassCourses: 0,
        importantInfo: 0,
        adminMessages: 0,
        quizCompleted: 0,
        courseCompleted: 0
      }
    });
  }
});

// MongoDB connection
console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');

    // Get the native MongoDB driver instance after successful connection
    const db = mongoose.connection.db;
    console.log('✅ Native MongoDB driver instance available');

    // Make the database instance available globally for routes
    app.locals.db = db;
  })
  .catch((error) => {
    console.log('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin'); // Added adminRoutes

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', courseRoutes);
app.use('/api', quizRoutes);
app.use('/api', adminRoutes); // Added adminRoutes

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API available at: http://localhost:${PORT}/api`);
  console.log(`📍 Notification counts: http://localhost:${PORT}/api/notifications/counts`);
  console.log(`📍 Quiz questions: http://localhost:${PORT}/api/quiz/questions`);
}).on('error', (error) => {
  console.log('❌ Server failed to start:', error.message);
});