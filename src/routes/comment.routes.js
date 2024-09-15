import { Router } from "express";
import { addComment, deleteComment, editComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add/:videoId").post(verifyJWT,addComment);
router.route("/update/:commentId").patch(verifyJWT,editComment);
router.route("/delete/:commentId").delete(verifyJWT,deleteComment);

export default router;