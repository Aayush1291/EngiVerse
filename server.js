const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/profiles', require('./backend/routes/profiles'));
app.use('/api/projects', require('./backend/routes/projects'));
app.use('/api/collaborations', require('./backend/routes/collaborations'));
app.use('/api/mentor', require('./backend/routes/mentor'));
app.use('/api/investor', require('./backend/routes/investor'));
app.use('/api/admin', require('./backend/routes/admin'));
app.use('/api/health', require('./backend/routes/health'));
app.use('/api/badges', require('./backend/routes/badges'));
app.use('/api/pitchdeck', require('./backend/routes/pitchdeck'));
app.use('/api/plagiarism', require('./backend/routes/plagiarism'));
app.use('/api/profile-verification', require('./backend/routes/profileVerification'));

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'ENGIVERSE API is running' });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/engiverse';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;

