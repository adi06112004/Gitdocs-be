import Commit from "../models/Commit.js";
import Document from "../models/Document.js";
import Project from "../models/Project.js";

// @desc    Get all commits (with optional filters)
// @route   GET /api/commits
// @access  Private
export const getAllCommits = async (req, res) => {
  try {
    const { projectId, branch, documentId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (projectId) filter.project = projectId;
    if (branch) filter.branch = branch;
    if (documentId) filter.document = documentId;

    const commits = await Commit.find(filter)
      .populate("author", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get commit by ID
// @route   GET /api/commits/:id
// @access  Private
export const getCommitById = async (req, res) => {
  try {
    const commit = await Commit.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!commit) {
      return res.status(404).json({ error: "Commit not found" });
    }

    res.status(200).json(commit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create commit
// @route   POST /api/commits
// @access  Private
export const createCommit = async (req, res) => {
  try {
    const { message, projectId, branch, documentId } = req.body;

    if (!message || !projectId || !branch || !documentId) {
      return res
        .status(400)
        .json({ error: "Please provide message, projectId, branch, and documentId" });
    }

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get document for snapshot
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Find last commit for this document on this branch (for parent reference)
    const lastCommit = await Commit.findOne({
      document: documentId,
      branch,
    }).sort({ createdAt: -1 });

    const commit = await Commit.create({
      message,
      project: projectId,
      document: documentId,
      branch,
      author: req.user._id,
      parentCommit: lastCommit ? lastCommit._id : null,
      snapshot: document.content,
    });

    res.status(201).json(commit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update commit
// @route   PUT /api/commits/:id
// @access  Private
export const updateCommit = async (req, res) => {
  try {
    const commit = await Commit.findById(req.params.id);

    if (!commit) {
      return res.status(404).json({ error: "Commit not found" });
    }

    // Only the author can update
    if (commit.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { message } = req.body;
    if (message) commit.message = message;

    await commit.save();

    res.status(200).json(commit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete commit
// @route   DELETE /api/commits/:id
// @access  Private
export const deleteCommit = async (req, res) => {
  try {
    const commit = await Commit.findById(req.params.id);

    if (!commit) {
      return res.status(404).json({ error: "Commit not found" });
    }

    // Only the author or project owner can delete
    const project = await Project.findById(commit.project);
    const isAuthor = commit.author.toString() === req.user._id.toString();
    const isProjectOwner =
      project && project.owner.toString() === req.user._id.toString();

    if (!isAuthor && !isProjectOwner) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Commit.findByIdAndDelete(commit._id);

    res.status(200).json({ message: "Commit deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
