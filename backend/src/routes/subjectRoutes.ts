import { Router } from "express";
import SubjectController from "../controllers/subjectController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all subject routes with JWT authentication middleware
router.use(authenticate);

router.get("/", SubjectController.getSubjects);
router.post("/", SubjectController.createSubject);
router.get("/:id", SubjectController.getSubjectById);
router.patch("/:id", SubjectController.updateSubject);
router.delete("/:id", SubjectController.deleteSubject);

export default router;
