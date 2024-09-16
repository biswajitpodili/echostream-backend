import { Router } from "express";
import {
  deleteVideo,
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
router.route("/update-video-details/:id").patch(verifyJWT, updateVideoDetails);
router
  .route("/update-video-file/:id")
  .patch(upload.single("videoFile"), verifyJWT, updateVideoFile);
router
  .route("/update-video-thumbnail/:id")
  .patch(upload.single("thumbnail"), verifyJWT, updateThumbnail);
router.route("/delete-video/:id").delete(verifyJWT, deleteVideo);

router.route("/get-videos").get(verifyJWT, getVideos);
router.route("/watch/:id").get(verifyJWT, watchVideo);

export default router;
