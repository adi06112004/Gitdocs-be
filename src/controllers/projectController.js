import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Document from "../models/Document.js";
import Commit from "../models/Commit.js";

// @desc    Get all projects for authenticated user
// @route   GET /api/projects
// @access  Private
export const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
      isArchived: false,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Project.countDocuments({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
      isArchived: false,
    });

    // For each project, fetch branches and documents
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const branches = await Branch.find({ project: project._id });
        const documents = await Document.find({ project: project._id });

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          branches: branches.map((b) => b.name),
          currentBranch: project.currentBranch,
          documents: documents.map((d) => d._id),
        };
      })
    );

    res.status(200).json(projectsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.isArchived) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check authorization
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember && !project.isPublic) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const branches = await Branch.find({ project: project._id });
    const documents = await Document.find({ project: project._id });

    res.status(200).json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      branches: branches.map((b) => b.name),
      currentBranch: project.currentBranch,
      documents: documents.map((d) => d._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Please provide a project name" });
    }

    const project = await Project.create({
      name,
      description: description || "",
      owner: req.user._id,
      currentBranch: "main",
    });

    // Auto-create "main" branch
    await Branch.create({
      name: "main",
      project: project._id,
      createdBy: req.user._id,
    });

    res.status(201).json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      branches: ["main"],
      currentBranch: project.currentBranch,
      documents: [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.isArchived) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { name, description, currentBranch } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (currentBranch) project.currentBranch = currentBranch;

    await project.save();

    const branches = await Branch.find({ project: project._id });
    const documents = await Document.find({ project: project._id });

    res.status(200).json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      branches: branches.map((b) => b.name),
      currentBranch: project.currentBranch,
      documents: documents.map((d) => d._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete all related data
    await Document.deleteMany({ project: project._id });
    await Commit.deleteMany({ project: project._id });
    await Branch.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
