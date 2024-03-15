const express = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const mongoString = "mongodb+srv://<username>:<password>@cluster0.s5b7diq.mongodb.net/TaskManager";
mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch(err => console.error('Connection error', err));

// Define user schema and model
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Define task schema and model
const taskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    category: { type: String, required: true, enum: ['Work', 'Personal', 'Errands'] },
    status: { type: String, required: true, enum: ['Pending', 'Completed'] },
    priority: { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
});

const Task = mongoose.model('Task', taskSchema);

// Handle user signup requests
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).send({ user });
});

// Handle user login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
        return res.status(401).send('Authentication failed');
    }
    res.send('Login successful');
});

// Handle task creation requests
app.post('/tasks', async (req, res) => {
    const { title, description, dueDate, category, priority } = req.body;
    const newTask = new Task({ title, description, dueDate, category, status: 'Pending', priority });
    await newTask.save();
    res.status(201).send(newTask);
});

// Handle task update requests
app.patch('/tasks/:id', async (req, res) => {
    const updates = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!task) {
        return res.status(404).send();
    }
    res.send(task);
});

// Handle requests to list all tasks with optional sorting
app.get('/tasks', async (req, res) => {
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        const tasks = await Task.find({}).sort(sort);
        res.send(tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
