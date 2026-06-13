import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { delFromCloudinary } from "../utils/delFromCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  let matchStage = {};
  if (query) {
    matchStage.$text = { $search: query };
  }
  const allVideos = await Video.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userInfo",
        pipeline: [
          {
            $project: { username: 1, fullName: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $sort: sortOptions,
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $project: {
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        duration: 1,
        views: 1,
        userInfo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
  const videoFileLocalPath = req.files?.videoFile?.[0].path;

  if (!thumbnailLocalPath || !videoFileLocalPath) {
    throw new ApiError(400, "thumbnail and video file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!thumbnail || !videoFile) {
    throw new ApiError(
      500,
      "failed to upload video or thumbnail on cloudinary"
    );
  }

  const video = await Video.create({
    title: title,
    description: description,
    thumbnail: thumbnail.url,
    thumbnailPublicId: thumbnail.public_id,
    videoFile: videoFile.url,
    videoPublicId: video.public_id,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "failed to create publish video ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, video, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findOne({ id: videoId, isPublished: true });

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail

  if (!title && !description && !req.file?.path) {
    throw new ApiError(400, "title or description or thumbnail is required");
  }
  const newThumbnail = req.file?.path;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "unauthorised request");
  }

  const updatedFields = {};

  if (title) {
    updatedFields.title = title;
  }
  if (description) {
    updatedFields.description = description;
  }
  if (newThumbnail) {
    const thumbnail = await uploadOnCloudinary(newThumbnail);

    if (!thumbnail) {
      throw new ApiError(500, "failed to upload thumbnail on cloudinary");
    }
    await delFromCloudinary(video.thumbnailPublicId);
    updatedFields.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    { $set: updatedFields },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, updatedVideo, "video update successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (video.owner.toString() !== req.user._id) {
    throw new ApiError(403, "unauthorised access");
  }

  await delFromCloudinary(video.thumbnailPublicId);
  await delFromCloudinary(video.videoPublicId);

  await await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (video.owner.toString() !== req.user._id) {
    throw new ApiError(403, "unauthorised access");
  }

  if (video.isPublished === false) {
    video.isPublished = true;
    await video.save();
    return res
      .status(201)
      .json(new ApiResponse(201, video, "video published successfully"));
  } else {
    video.isPublished = false;
    video.save();
    return res
      .status(201)
      .json(new ApiResponse(201, video, "video unpublished successfully"));
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
