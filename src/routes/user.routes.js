import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChanneProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//Unsecured Routes
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCoount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//Secured Routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").put(verifyJWT, changePassword);
router.route("/user-details").get(verifyJWT, getCurrentUser);
router.route("/update-user").put(verifyJWT, updateUserDetails);
router
  .route("/update-avatar")
  .put(upload.single("avatar"), verifyJWT, updateUserAvatar);
router
  .route("/update-coverimage")
  .put(upload.single("coverImage"), verifyJWT, updateUserCoverImage);
router.route("/:username").get(verifyJWT, getUserChanneProfile);

export default router;
