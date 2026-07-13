const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tasks/project/:projectId — list all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tasks — create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, project: projectId, assignee, status, priority, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      assignee: assignee || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/tasks/:id — get task details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title owner members');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, assignee, status, priority, dueDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/tasks/:id — delete task and its comments
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete all comments on this task
    await Comment.deleteMany({ task: task._id });

    // Delete the task
    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
