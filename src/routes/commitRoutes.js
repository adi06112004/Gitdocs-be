import { Router } from "express";
import {
  getAllCommits,
  getCommitById,
  createCommit,
  updateCommit,
  deleteCommit,
} from "../controllers/commitController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect); // All commit routes are protected

router.get("/", getAllCommits);
router.get("/:id", getCommitById);
router.post("/", createCommit);
router.put("/:id", updateCommit);
router.delete("/:id", deleteCommit);

export default router;
