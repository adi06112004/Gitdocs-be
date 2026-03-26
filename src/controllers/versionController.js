import Branch from "../models/Branch.js";
import Project from "../models/Project.js";

// @desc    Get all versions/branches (with optional projectId filter)
// @route   GET /api/versions
// @access  Private
export const getAllVersions = async (req, res) => {
  try {
    const { projectId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (projectId) {
      filter.project = projectId;
    }

    const versions = await Branch.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get version by ID
// @route   GET /api/versions/:id
// @access  Private
export const getVersionById = async (req, res) => {
  try {
    const version = await Branch.findById(req.params.id);

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    res.status(200).json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new branch/version
// @route   POST /api/versions
// @access  Private
export const createVersion = async (req, res) => {
  try {
    const { name, projectId } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({ error: "Please provide name and projectId" });
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

    // Check if branch name already exists for this project
    const existingBranch = await Branch.findOne({ name, project: projectId });
    if (existingBranch) {
      return res.status(400).json({ error: "Branch with this name already exists" });
    }

    const version = await Branch.create({
      name,
      project: projectId,
      createdBy: req.user._id,
      parentBranch: project.currentBranch,
    });

    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update version
// @route   PUT /api/versions/:id
// @access  Private
export const updateVersion = async (req, res) => {
  try {
    const version = await Branch.findById(req.params.id);

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Verify user has access via project
    const project = await Project.findById(version.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { name } = req.body;

    if (name) {
      // Check if new name already exists
      const existingBranch = await Branch.findOne({
        name,
        project: version.project,
        _id: { $ne: version._id },
      });

      if (existingBranch) {
        return res.status(400).json({ error: "Branch with this name already exists" });
      }

      version.name = name;
    }

    await version.save();

    res.status(200).json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete version
// @route   DELETE /api/versions/:id
// @access  Private
export const deleteVersion = async (req, res) => {
  try {
    const version = await Branch.findById(req.params.id);

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Prevent deleting "main" branch
    if (version.name === "main") {
      return res.status(400).json({ error: "Cannot delete the main branch" });
    }

    // Verify user has access via project
    const project = await Project.findById(version.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Branch.findByIdAndDelete(version._id);

    res.status(200).json({ message: "Version deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
