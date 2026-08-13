import { Router } from "express";
import TaskController from "../controllers/taskController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", TaskController.getTasks);
router.post("/", TaskController.createTask);
router.get("/:id", TaskController.getTaskById);
router.patch("/:id", TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);

export default router;
