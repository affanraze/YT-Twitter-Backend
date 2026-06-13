import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const video = await Video.exists({ _id: videoId });

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const likedVideo = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (likedVideo) {
    await Like.findByIdAndDelete(likedVideo._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "video unliked successfully"));
  }

  const videoLiked = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!videoLiked) {
    throw new ApiError(500, "failed to like video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoLiked, "video liked successfully"));
});

const getVideoLikeStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const like = await Like.exists({ video: videoId, likedBy: req.user._id });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked: like ? true : false },
        "like status fetched successfuly"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const comment = await Comment.exists({ _id: commentId });

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment unliked successfully"));
  }

  const commentLiked = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!commentLiked) {
    throw new ApiError(500, "failed to like comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentLiked, "comment liked successfully"));
});

const getCommentLikeStatus = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const like = await Like.exists({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: like ? true : false }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const tweet = await Tweet.exists({ _id: tweetId });

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res.status(200).json(new ApiResponse(200, {}, "tweet disliked "));
  }

  const tweetLiked = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!tweetLiked) {
    throw new ApiError(500, "failed to like tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweetLiked, "tweet liked successfully"));
});

const getTweetLikeStatus = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const like = await Like.exists({ tweet: tweetId, likedBy: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: like ? true : false }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.find({ likedBy: req.user._id }).populate(
    "video"
  );

  if (likedVideos.length === 0) {
    throw new ApiError(404, "no liked videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "all liked videos fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
