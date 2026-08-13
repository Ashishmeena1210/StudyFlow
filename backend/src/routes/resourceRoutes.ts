import { Router } from "express";
import ResourceController from "../controllers/resourceController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/search", ResourceController.searchResources);

router.get("/", ResourceController.getResources);
router.post("/", ResourceController.createResource);
router.get("/:id", ResourceController.getResourceById);
router.patch("/:id", ResourceController.updateResource);
router.delete("/:id", ResourceController.deleteResource);

router.post("/:id/save", ResourceController.saveResource);
router.post("/:id/favorite", ResourceController.favoriteResource);
router.patch("/:id/open", ResourceController.openResource);

export default router;
