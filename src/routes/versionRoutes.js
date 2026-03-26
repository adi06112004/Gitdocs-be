import { Router } from "express";
import {
  getAllVersions,
  getVersionById,
  createVersion,
  updateVersion,
  deleteVersion,
} from "../controllers/versionController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect); // All version routes are protected

router.get("/", getAllVersions);
router.get("/:id", getVersionById);
router.post("/", createVersion);
router.put("/:id", updateVersion);
router.delete("/:id", deleteVersion);

export default router;
