import { Router } from "express";
import SessionController from "../controllers/sessionController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/active", SessionController.getActiveSession);
router.get("/", SessionController.getStudySessions);
router.post("/", SessionController.createStudySession);
router.get("/:id", SessionController.getStudySessionById);
router.post("/:id/complete", SessionController.completeStudySession);
router.post("/:id/cancel", SessionController.cancelStudySession);

export default router;
