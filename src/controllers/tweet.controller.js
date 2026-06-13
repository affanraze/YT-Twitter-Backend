import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "content is required");
  }

  if (content.trim().length > 280) {
    throw new ApiError(400, "tweet cannot exceed 280 characters");
  }

  const tweet = await Tweet.create({ content: content, owner: req.user._id });

  if (!tweet) {
    throw new ApiError(500, "failed to create tweet");
  }

  const createdTweet = await Tweet.findById(tweet._id).populate(
    "owner",
    "username avatar fullName"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdTweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "user id is required");
  }

  const userTweets = await Tweet.find({ owner: userId }).sort({
    createdAt: -1,
  });

  if (userTweets.length === 0) {
    throw new ApiError(404, "no tweet found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { newContent } = req.body;

  if (!newContent || newContent.trim() === "")
    throw new ApiError(400, "new content required");

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) throw new ApiError(404, "no tweet found");

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "unauthorised request");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: newContent },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(400, "unable to update tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweet id is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorised request");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
