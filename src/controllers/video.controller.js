import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.user) {
      throw new ApiError(401, "Unauthorized to upload video");
    }

    if (!title || !description) {
      throw new ApiError(400, "Enter all feilds");
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
      throw new ApiError(400, "Please upload files properly");
    }

    const { videoFile, thumbnail } = req.files;

    const videoFileResponse = await uploadOnCloudinary(videoFile[0].path);
    const thumbnailRespomse = await uploadOnCloudinary(thumbnail[0].path);

    if (!videoFileResponse || !thumbnailRespomse) {
      throw new ApiError(
        500,
        "Something went wrong while uploading files to cloudinary"
      );
    }

    const video = await Video.create({
      title,
      description,
      videoFile: videoFileResponse.url,
      thumbnail: thumbnailRespomse.url,
      duration: videoFileResponse.duration,
      owner: req.user._id,
    });

    if (!video) {
      throw new ApiError(500, "failed to upload video");
    }

    res
      .status(201)
      .json(new ApiResponse(200, "Video uploaded Successfully", video));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while uploading the video"
    );
  }
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublished } = req.body;
    if (!id) {
      throw new ApiError(400, "Not a valid video ID");
    }
    if (!(title || description || isPublished)) {
      throw new ApiError(400, "Enter a field");
    }
    const video = await Video.findById(id);

    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized to edit video");
    }
    if (title) video.title = title;
    if (description) video.description = description;
    if (isPublished) video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(200, "Video Data Updated", video));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while updating video details"
    );
  }
});

const updateVideoFile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw new ApiError(400, "File not uploaded properly");
    }
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(400, "Invalid video id");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized to update videoFile");
    }
    const existingVideoFilePublicId = video?.videoFile.substring(
      video?.videoFile.lastIndexOf("/") + 1,
      video?.videoFile.lastIndexOf(".")
    );
    await deleteFromCloudinary(existingVideoFilePublicId, "video");

    const videoFileUploadResponse = await uploadOnCloudinary(req.file.path);
    video.videoFile = videoFileUploadResponse.url;
    video.duration = videoFileUploadResponse.duration;
    await video.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(new ApiResponse(200, "Successfully Updated the videoFile", video));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Something went wrong while updating videoFile"
    );
  }
});

const updateThumbnail = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      throw new ApiError(400, "File not handled properly");
    }
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(400, "Invalid video id");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized to update thumbnail");
    }
    const existingThumbnailPublicId = video?.thumbnail.substring(
      video?.thumbnail.lastIndexOf("/") + 1,
      video?.thumbnail.lastIndexOf(".")
    );
    await deleteFromCloudinary(existingThumbnailPublicId, "image");
    const thumbnailUploadResponse = await uploadOnCloudinary(req.file.path);
    video.thumbnail = thumbnailUploadResponse.url;
    video.save({ validateBeforeSave: true });

    res
      .status(200)
      .json(new ApiResponse(200, "Thumbnail updated successfully", video));
  } catch (error) {
    throw new ApiError(
      400,
      error.message ||
        "Something went wrong while updating the thumbnail, try later"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(400, "Invalid video id");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized to delete video");
    }

    const existingThumbnailPublicId = video?.thumbnail.substring(
      video?.thumbnail.lastIndexOf("/") + 1,
      video?.thumbnail.lastIndexOf(".")
    );
    const existingVideoFilePublicId = video?.videoFile.substring(
      video?.videoFile.lastIndexOf("/") + 1,
      video?.videoFile.lastIndexOf(".")
    );
    await deleteFromCloudinary(existingThumbnailPublicId, "image");
    await deleteFromCloudinary(existingVideoFilePublicId, "video");
    const response = await Video.findByIdAndDelete(id);
    if (!response) {
      throw new ApiError(400, "Failed to delete the video, try again later");
    }
    res.status(200).json(new ApiResponse(200, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Something went wrong while deleting the video"
    );
  }
});

const getVideos = asyncHandler(async (req, res) => {
  try {
    const videos = await Video.aggregate([
      {
        $match: {
          isPublished: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      // {
      //   $lookup: {
      //     from: "likes",
      //     localField: "_id",
      //     foreignField: "video",
      //     as: "videolikes",
      //   }
      // },
      // {
      //   $addFields: {
      //     likes: {
      //       $size: "$videolikes",
      //     },
      //   },
      // },
      {
        $project: {
          title: 1,
          thumbnail: 1,
          owner: 1,
          createdAt: 1,
          views: 1,
          duration: 1,
        },
      },
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, "Videos fetched successfully", videos));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching videos"
    );
  }
});

const watchVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  //Updating watch history of the user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        watchHistory: id,
      },
    },
    { new: true }
  );

  //Increasing the views by 1
  await Video.findByIdAndUpdate(
    id,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  );

  //Aggregate Pipeline for video information
  const video = await Video.aggregate([
    //Match the video ID
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },

    //Owner Information and Subscription Information
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              totalSubscribers: {
                $size: "$subscribers",
              },
              isSubscribedtoThisChannel: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              firstname: 1,
              username: 1,
              fullname: 1,
              avatar: 1,
              totalSubscribers: 1,
              isSubscribedtoThisChannel: 1,
            },
          },
        ],
      },
    },

    //Likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },

    //Comments
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment",
              as: "likes",
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
              likes: {
                $size: "$likes",
              },
            },
          },
          {
            $project: {
              owner: 1,
              content: 1,
              likes: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },

    //Calculating the total likes of the video and owner information
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
      },
    },

    //Projecting the required fields
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        owner: 1,
        views: 1,
        likes: 1,
        comments: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!video.length) {
    throw new ApiError(400, "Invalid video ID");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video[0]));
});

export {
  uploadVideo,
  updateVideoDetails,
  updateVideoFile,
  updateThumbnail,
  deleteVideo,
  getVideos,
  watchVideo,
};
