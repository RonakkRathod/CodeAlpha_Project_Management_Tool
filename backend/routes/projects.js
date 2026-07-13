const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/projects — list projects user is owner or member of
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    // Add task count for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const doneCount = await Task.countDocuments({ project: project._id, status: 'done' });
        return {
          ...project.toObject(),
          taskCount,
          doneCount
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/projects — create a new project
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const project = await Project.create({
      title,
      description: description || '',
      owner: req.user._id,
      members: [req.user._id]
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.status(201).json({ ...project.toObject(), taskCount: 0, doneCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/projects/:id — get project details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    const isOwner = project.owner._id.toString() === req.user._id.toString();

    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can update' });
    }

    const { title, description } = req.body;
    if (title) project.title = title;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/projects/:id — delete project and all related data
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can delete' });
    }

    // Delete all comments on tasks in this project
    const taskIds = await Task.find({ project: project._id }).select('_id');
    await Comment.deleteMany({ task: { $in: taskIds.map((t) => t._id) } });

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/projects/:id/members — add member by email
router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can add members' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Check if already a member
    if (project.members.some((m) => m.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can remove members' });
    }

    // Cannot remove the owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
