import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addSubscriber,
  removeSubscriber,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/subscribe/:channelId").post(verifyJWT, addSubscriber);
router.route("/unsubscribe/:channelId").delete(verifyJWT, removeSubscriber);

export default router;
