"use server";

import Tag, { ITag } from "@/database/tag.model";
import { connectToDatabase } from "../mongoose";
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from "./shared.types";
import User from "@/database/user.mode";
import Question from "@/database/question.model";
import { FilterQuery } from "mongoose";

export const getTopIntractedTags = async (
  params: GetTopInteractedTagsParams
) => {
  try {
    connectToDatabase();

    const { userId } = params;

    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    return [
      { _id: "1", name: "tag1" },
      { _id: "2", name: "tag2" },
    ];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllTags = async (params: GetAllTagsParams) => {
  try {
    connectToDatabase();

    const { searchQuery } = params;

    const query: FilterQuery<typeof Tag> = {};

    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }

    const tags = await Tag.find(query);

    return { tags };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getQuestionByTagId = async (params: GetQuestionsByTagIdParams) => {
  try {
    connectToDatabase();

    const { tagId, searchQuery } = params;

    const query: FilterQuery<typeof Tag> = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }
    const tagFilter: FilterQuery<ITag> = { _id: tagId };
    const tag = await Tag.findOne(tagFilter).populate({
      path: "questions",
      model: Question,
      match: query,
      options: {
        sort: { createdAt: -1 },
      },
      populate: [
        { path: "tags", model: "Tag", select: "_id name" },
        { path: "author", model: "User", select: "_id clerkId name picture" },
      ],
    });
    if (!tag) {
      throw new Error("Tag not found");
    }
    const questions = tag.questions;

    return { tagTitle: tag.name, questions };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTopPopularTags = async () => {
  try {
    connectToDatabase();

    const popularTags = await Tag.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
      { $sort: { numberOfQuestions: -1 } },
    ]).limit(5);
    return popularTags;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
