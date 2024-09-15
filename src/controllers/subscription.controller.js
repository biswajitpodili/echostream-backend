import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addSubscriber = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }
    const response = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to add subscriber");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Subscriber added successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while adding subscriber"
    );
  }
});

const removeSubscriber = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }
    const response = await Subscription.findOneAndDelete({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to remove subscriber");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Subscriber removed successfully", response));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while removing subscriber"
    );
  }
});


export { addSubscriber, removeSubscriber };