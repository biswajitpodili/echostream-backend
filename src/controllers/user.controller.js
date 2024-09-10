import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  user.password = undefined;
  user.refreshToken = undefined;

  // 10. check if user is created
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }

  // 11. send the response
  res.status(201).json(new ApiResponse(200, "User created successfully", user));
});

export { registerUser };
