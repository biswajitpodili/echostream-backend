import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1. Get the user data from the request body
  const { fullname, username, email, password } = req.body;

  // 2. Validate the user data
  if (!fullname || !username || !email || !password) {
    throw new ApiError(400, "Please fill in all fields");
  }

  // 3. check if the user already exists
  const isUserExist = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserExist) {
    throw new ApiError(409, "User already exists");
  }

  // 4. check if avatar exists
  if (!req.files || !req.files.avatar) {
    throw new ApiError(400, "Please upload an avatar");
  }

  // 5. upload the avatar to cloudinary
  const avatar = await uploadOnCloudinary(req.files.avatar[0].path);

  // 6. upload the cover image to cloudinary
  let coverImage;
  if (req.files.coverImage) {
    coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
  }

  // 7. check if avatar image is uploaded
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  // 8. create a new user
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // 9. exclude password and refresh token from the response
  const userRegistered = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // 10. check if user is created
  if (!userRegistered) {
    throw new ApiError(500, "Failed to create user");
  }

  // 11. send the response
  res
    .status(201)
    .json(new ApiResponse(200, "User created successfully", userRegistered));
});

const loginUser = asyncHandler(async (req, res) => {
  // 1. Get the user data from the request body
  const { email, username, password } = req.body;

  // 2. Validate the user data (username/email, password)
  if (!(email || username) || !password) {
    throw new ApiError(400, "Please provide required fields");
  }

  // 3. Check if the user exists
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 4. Check if the password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 5. Generate access token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // 6. Send Cookies and the response
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //This removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged out", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Unauthorized refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Tokens refreshed", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Unauthorized token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  console.log(req);
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(new ApiResponse(200, "Password Changed Successfully", {}));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Something went wrong while changing password"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  try {
    const { fullname, email } = req.body;
    if (!(fullname || email)) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await User.findOneAndUpdate(
      req.user?._id,
      {
        $set: {
          fullname,
          email,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(200, "User updated", user));
  } catch (error) {
    throw new ApiError(400, "Something went wrong while updating user");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Avatar not handled properly");
    }

    const avatar = await uploadOnCloudinary(req.file.path);

    if (!avatar) {
      throw new ApiError(500, "Failed to upload");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    res
      .status(200)
      .json(new ApiResponse(200, "Avatar updated successfully", user));
  } catch (error) {
    throw new ApiError(400, "Something went wrong while updating avatar");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImagePath = req.file?.path;
    if (!coverImagePath) {
      throw new ApiError(400, "Upload cover image");
    }
    const coverImage = await uploadOnCloudinary(coverImagePath);
    if (!coverImage.url) {
      throw new ApiError(500, "Image not uploaded");
    }
    const user = await User.findOneAndUpdate(
      req.user?._id,
      {
        $set: { coverImage: coverImage.url },
      },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(
        500,
        "Something went wrong while updating cover image"
      );
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Cover image updated successfully", user));
  } catch (error) {
    throw new ApiError(400, "Something went wrong while updating cover image");
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;
    if (!username?.trim()) {
      throw new ApiError(400, "Username is missing");
    }
    const channel = await User.aggregate([
      {
        //Stages / Pipelines
        $match: {
          username: username?.trim().toLowerCase(),
        },
      },
      {
        //Pipeline for subscribers
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        //Pipeline for subscribed to
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          totalSubscribers: {
            $size: "$subscribers",
          },
          totalSubscribedTo: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
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
          fullname: 1,
          username: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          totalSubscribers: 1,
          totalSubscribedTo: 1,
          isSubscribed: 1,
        },
      },
    ]);
    if (!channel.length) {
      throw new ApiError(404, "Channel not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "Channel data fetched successfully", channel[0])
      );
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Something went wrong while accessing the channel data"
    );
  }
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
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
                      firstname: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Watch history fetched successfully",
          user[0].watchHistory
        )
      );
  } catch (error) {
    throw new ApiError(
      400,
      error.mwssage || "Something went wrong while getting watchHistory"
    );
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
