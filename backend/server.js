require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000 || process.env.PORT;
const connectDB = require('./config/connectDB');
const authRoutes = require('./routes/auth.route');
const projectRoutes = require('./routes/project.route');
const jobRoutes = require('./routes/job.route');
const applicationRoutes = require('./routes/application.route');
const aiRoutes = require('./routes/ai.route');

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Hello World');
})

connectDB().then(() => {
  app.listen(PORT, () => { console.log(`Server is running on port http://localhost:${PORT}`)})
}).catch((error) => { console.log(error)});