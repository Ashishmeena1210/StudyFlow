import { Router } from "express";
import AIController from "../controllers/aiController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authenticate);

router.post("/resources/suggest", aiRateLimiter, AIController.suggestResources);

export default router;
