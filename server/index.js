const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./server/routes/auth');
const systemRoutes = require('./server/routes/system');

const app = express();
const encryptionMiddleware = require('./server/middleware/encryption');
app.use(cors());
app.use(express.json());
app.use(encryptionMiddleware);

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/login_site';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
