import Document from "../models/Document.js";
import Project from "../models/Project.js";

// @desc    Get all documents (with optional filters)
// @route   GET /api/documents
// @access  Private
export const getAllDocuments = async (req, res) => {
  try {
    const { projectId, branch } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (projectId) {
      // Verify user has access to the project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const isOwner = project.owner.toString() === req.user._id.toString();
      const isMember = project.members.some(
        (m) => m.toString() === req.user._id.toString()
      );

      if (!isOwner && !isMember && !project.isPublic) {
        return res.status(403).json({ error: "Not authorized" });
      }

      filter.project = projectId;
    }

    if (branch) {
      filter.branch = branch;
    }

    const documents = await Document.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify user has access via project
    const project = await Project.findById(document.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember && !project.isPublic) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req, res) => {
  try {
    const { name, content, projectId, branch } = req.body;

    if (!name || !projectId || !branch) {
      return res
        .status(400)
        .json({ error: "Please provide name, projectId, and branch" });
    }

    // Verify user has access to the project
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

    const document = await Document.create({
      name,
      content: content || "",
      project: projectId,
      branch,
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify user has access via project
    const project = await Project.findById(document.project);
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

    const { name, content, branch } = req.body;

    if (name) document.name = name;
    if (content !== undefined) document.content = content;
    if (branch) document.branch = branch;
    document.lastEditedBy = req.user._id;

    await document.save();

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify user has access via project
    const project = await Project.findById(document.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Document.findByIdAndDelete(document._id);

    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
