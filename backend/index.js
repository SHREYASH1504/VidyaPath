const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const jobRoutes = require('./routes/jobRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const storageChatbotRoutes = require('./routes/storageChatbotRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/v1/chat', storageChatbotRoutes);

app.get('/', (req, res) => {
    res.send('VidyaPath API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
