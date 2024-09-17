import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.create({
      content,
      owner: req.user._id,
    });

    if (!tweet) {
      throw new ApiError(500, "Failed to create tweet");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Tweet created successfully", tweet));
  } catch (error) {
    throw new ApiError(500, "Failed to create tweet");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!content) {
      throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this tweet");
    }
    tweet.content = content;
    await tweet.save({ validateBeforeSave: false });
    res
      .status(200)
      .json(new ApiResponse(200, "Tweet updated successfully", tweet));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to update tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this tweet");
    }
    const response = await Tweet.findByIdAndDelete(tweetId);
    res
      .status(200)
      .json(new ApiResponse(200, "Tweet deleted successfully", response));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to delete tweet");
  }
});

export { createTweet, updateTweet, deleteTweet };
