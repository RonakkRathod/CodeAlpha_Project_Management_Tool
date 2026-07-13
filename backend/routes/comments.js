const express = require('express');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/comments/task/:taskId — list comments for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/comments — add a comment to a task
router.post('/', async (req, res) => {
  try {
    const { text, taskId } = req.body;

    if (!text || !taskId) {
      return res.status(400).json({ message: 'Text and taskId are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      text,
      task: taskId,
      author: req.user._id
    });

    await comment.populate('author', 'name email avatar');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/comments/:id — delete a comment (author only)
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the author can delete their comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the comment author can delete' });
    }

    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
