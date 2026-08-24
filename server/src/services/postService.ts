import mongoose from "mongoose";

import Post from "../models/Post.js";

import Business from "../models/Business.js";

import Product from "../models/Product.js";

import { AppError } from "../utils/AppError.js";

import type {
  CreatePostInput,
  UpdatePostInput,
  AddPostMediaInput,
  ReorderPostMediaInput,
} from "../types/post.js";

async function verifyBusinessOwnership(
  businessId: string,
  ownerId: string,
) {
  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to manage it",
      403,
    );
  }

  return business;
}

async function verifyProductBelongsToBusiness(
  productId: string,
  businessId: string,
) {
  const product = await Product.findOne({
    _id: productId,
    businessId,
  });

  if (!product) {
    throw new AppError(
      "Product not found or does not belong to this business",
      400,
    );
  }

  return product;
}

export async function createPost(
  ownerId: string,
  input: CreatePostInput,
) {
  await verifyBusinessOwnership(
    input.businessId,
    ownerId,
  );

  if (input.productId) {
    await verifyProductBelongsToBusiness(
      input.productId,
      input.businessId,
    );
  }

  const post = await Post.create({
    businessId: input.businessId,
    title: input.title,
    content: input.content,
    type: input.type,
    status: input.status,
    isVisible: input.isVisible,
    hashtags: input.hashtags,
    productId: input.productId
      ? new mongoose.Types.ObjectId(
          input.productId,
        )
      : undefined,
    eventDate: input.eventDate,
  });

  return post;
}

export async function getMyPosts(
  ownerId: string,
  businessId: string,
) {
  await verifyBusinessOwnership(
    businessId,
    ownerId,
  );

  return Post.find({
    businessId,
  }).sort({
    createdAt: -1,
  });
}

export async function getPublicPosts(
  businessId: string,
) {
  return Post.find({
    businessId,
    status: "published",
    isVisible: true,
  }).sort({
    createdAt: -1,
  });
}

export async function getPostById(
  ownerId: string,
  postId: string,
) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(
      "Post not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    post.businessId.toString(),
    ownerId,
  );

  return post;
}

export async function updatePost(
  ownerId: string,
  postId: string,
  input: UpdatePostInput,
) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(
      "Post not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    post.businessId.toString(),
    ownerId,
  );

  if (input.title !== undefined) {
    post.title = input.title;
  }

  if (input.content !== undefined) {
    post.content = input.content;
  }

  if (input.type !== undefined) {
    post.type = input.type;
  }

  if (input.status !== undefined) {
    post.status = input.status;
  }

  if (input.isVisible !== undefined) {
    post.isVisible = input.isVisible;
  }

  if (input.hashtags !== undefined) {
    post.hashtags = input.hashtags;
  }

  if (input.eventDate !== undefined) {
    post.eventDate = input.eventDate;
  }

  if (input.productId !== undefined) {
    if (input.productId) {
      await verifyProductBelongsToBusiness(
        input.productId,
        post.businessId.toString(),
      );

      post.productId =
        new mongoose.Types.ObjectId(
          input.productId,
        );
    } else {
      post.productId = undefined;
    }
  }

  await post.save();

  return post;
}

export async function deletePost(
  ownerId: string,
  postId: string,
) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(
      "Post not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    post.businessId.toString(),
    ownerId,
  );

  await Post.findByIdAndDelete(postId);

  return true;
}

export async function addPostMedia(
  ownerId: string,
  postId: string,
  input: AddPostMediaInput,
  media: {
    url: string;
    publicId: string;
    type: "image" | "video";
  },
) {
  const post = await getPostById(
    ownerId,
    postId,
  );

  if (post.media.length >= 10) {
    throw new AppError(
      "A post can have a maximum of 10 media files",
      400,
    );
  }

  const isPrimary =
    media.type === "image" &&
    !post.media.some(
      (item) => item.isPrimary,
    );

  post.media.push({
    url: media.url,
    publicId: media.publicId,
    type: media.type,
    alt: input.alt,
    isPrimary,
    sortOrder: post.media.length,
  });

  await post.save();

  return post;
}

export async function setPrimaryPostMedia(
  ownerId: string,
  postId: string,
  mediaId: string,
) {
  const post = await getPostById(
    ownerId,
    postId,
  );

  const media = post.media.find(
    (item) =>
      item._id?.toString() === mediaId,
  );

  if (!media) {
    throw new AppError(
      "Post media not found",
      404,
    );
  }

  if (media.type !== "image") {
    throw new AppError(
      "Only images can be set as primary media",
      400,
    );
  }

  post.media.forEach((item) => {
    item.isPrimary = false;
  });

  media.isPrimary = true;

  await post.save();

  return post;
}

export async function deletePostMedia(
  ownerId: string,
  postId: string,
  mediaId: string,
) {
  const post = await getPostById(
    ownerId,
    postId,
  );

  const media = post.media.find(
    (item) =>
      item._id?.toString() === mediaId,
  );

  if (!media) {
    throw new AppError(
      "Post media not found",
      404,
    );
  }

  post.media = post.media.filter(
    (item) =>
      item._id?.toString() !== mediaId,
  );

  post.media.forEach(
    (item, index) => {
      item.sortOrder = index;

      if (item.type !== "image") {
        item.isPrimary = false;
      }
    },
  );

  const hasPrimaryImage =
    post.media.some(
      (item) => item.isPrimary,
    );

  if (!hasPrimaryImage) {
    const firstImage =
      post.media.find(
        (item) =>
          item.type === "image",
      );

    if (firstImage) {
      firstImage.isPrimary = true;
    }
  }

  await post.save();

  return {
    post,
    deletedMedia: media,
  };
}

export async function reorderPostMedia(
  ownerId: string,
  postId: string,
  input: ReorderPostMediaInput,
) {
  const post = await getPostById(
    ownerId,
    postId,
  );

  if (
    input.mediaIds.length !==
    post.media.length
  ) {
    throw new AppError(
      "All post media IDs must be included when reordering",
      400,
    );
  }

  const mediaMap = new Map(
    post.media.map((media) => [
      media._id!.toString(),
      media,
    ]),
  );

  const reorderedMedia =
    input.mediaIds.map(
      (mediaId, index) => {
        const media =
          mediaMap.get(mediaId);

        if (!media) {
          throw new AppError(
            "Invalid post media ID",
            400,
          );
        }

        media.sortOrder = index;

        return media;
      },
    );

  post.media = reorderedMedia;

  await post.save();

  return post;
}