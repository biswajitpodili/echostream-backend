import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const videoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    const response = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like the video");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Video liked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while liking the video"
    );
  }
});

const videoUnlike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    const response = await Like.findOneAndDelete({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike the video");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Video unliked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while unliking the video"
    );
  }
});

const commentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    const response = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like the comment");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Comment liked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while liking the comment"
    );
  }
});

const commentUnlike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const response = await Like.findOneAndDelete({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (!response) {
      throw new ApiError(500, "Failed to unlike the comment");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Comment unliked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while unliking the comment"
    );
  }
});

const tweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;

    const response = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like the tweet");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Tweet liked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while liking a tweet"
    );
  }
});

const tweetUnlike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;

    const response = await Like.findOneAndDelete({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike the tweet");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Tweet unliked successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while unliking a tweet"
    );
  }
});

export {
  videoLike,
  videoUnlike,
  commentLike,
  commentUnlike,
  tweetLike,
  tweetUnlike,
};
