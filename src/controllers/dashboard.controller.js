import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  const stats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "Videos",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "likes",
        let: { videosId: "$Videos._id" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$video", "$$videosId"] },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$Videos",
        },
        totalVideosViews: {
          $sum: "$Videos.views",
        },
        totalSubscribers: {
          $size: "$subscribers",
        },
        totalLikes: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        totalVideos: 1,
        totalVideosViews: 1,
        totalSubscribers: 1,
        totalLikes: 1,
      },
    },
  ]);

  if (!stats?.length) {
    throw new ApiError(404, "channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats[0], "stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;

  const page = Number(req.query.page);
  const limit = Number(req.query.limit);

  const allVideos = await Video.find({ owner: channelId })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalVideos = await Video.countDocuments({ owner: channelId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allVideos,
        totalVideos,
        page: parseInt(page),
        totalPages: Math.ceil(totalVideos / limit),
      },
      "all videos fetched successfully"
    )
  );
});


export { getChannelStats, getChannelVideos };
