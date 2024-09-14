import { Router } from "express";
import {
  getVideos,
  updateThumbnail,
  updateVideoDetails,
  updateVideoFile,
  uploadVideo,
  watchVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//Secured Routes
router.route("/upload-video").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  verifyJWT,
  uploadVideo
);
router.route("/update-video-details").patch(verifyJWT, updateVideoDetails);
router
  .route("/update-video-file")
  .patch(upload.single("videoFile"), verifyJWT, updateVideoFile);
router
  .route("/update-video-thumbnail")
  .patch(upload.single("thumbnail"), verifyJWT, updateThumbnail);

router.route("/get-videos").get(verifyJWT, getVideos);
router.route("/watch/:id").get(verifyJWT, watchVideo);

export default router;
