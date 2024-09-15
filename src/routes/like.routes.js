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

router.route("/video/like/:videoId").get(verifyJWT, videoLike);
router.route("/video/unlike/:videoId").get(verifyJWT, videoUnlike);

router.route("/comment/like/:commentId").get(verifyJWT, commentLike);
router.route("/comment/unlike/:commentId").get(verifyJWT, commentUnlike);

router.route("/tweet/like/:tweetId").get(verifyJWT, tweetLike);
router.route("/tweet/unlike/:tweetId").get(verifyJWT, tweetUnlike);

export default router;
