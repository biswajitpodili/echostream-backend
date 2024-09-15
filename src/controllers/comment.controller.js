import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  try {
    const { comment } = req.body;
    const { videoId } = req.params;

    if (!comment) {
      throw new ApiError(400, "Please enter a comment");
    }

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }

    const response = await Comment.create({
      content: comment,
      video: videoId,
      owner: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to add comment");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Comment added successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while adding the comment"
    );
  }
});

const editComment = asyncHandler(async (req, res) => {
  try {
    const { comment } = req.body;
    const { commentId } = req.params;

    if (!comment) {
      throw new ApiError(400, "Please enter a comment");
    }

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const response = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content: comment,
        },
      },
      { new: true }
    );

    if (!response) {
      throw new ApiError(500, "Failed to edit comment");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Comment edited successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while editing the comment"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const response = await Comment.findByIdAndDelete(commentId);

    if (!response) {
      throw new ApiError(500, "Failed to delete comment");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Comment deleted successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the comment"
    );
  }
});

export { addComment, editComment, deleteComment };
