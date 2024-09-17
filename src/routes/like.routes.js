import { Router } from "express";
import {
  commentLike,
  commentUnlike,
  tweetLike,
  tweetUnlike,
  videoLike,
  videoUnlike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/video/like/:videoId").put(verifyJWT, videoLike);
router.route("/video/unlike/:videoId").put(verifyJWT, videoUnlike);

router.route("/comment/like/:commentId").put(verifyJWT, commentLike);
router.route("/comment/unlike/:commentId").put(verifyJWT, commentUnlike);

router.route("/tweet/like/:tweetId").put(verifyJWT, tweetLike);
router.route("/tweet/unlike/:tweetId").put(verifyJWT, tweetUnlike);

export default router;
