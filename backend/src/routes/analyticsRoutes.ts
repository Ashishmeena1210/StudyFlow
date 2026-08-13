import { Router } from "express";
import AnalyticsController from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/overview", AnalyticsController.getOverview);
router.get("/", AnalyticsController.getOverview);

export default router;
