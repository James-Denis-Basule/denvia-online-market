import mongoose, { Document, Schema, Types } from "mongoose";

export type PostType =
  | "product_promotion"
  | "announcement"
  | "event"
  | "product_launch"
  | "special_offer"
  | "business_news";

export type PostStatus = "draft" | "published" | "archived";

export type PostMediaType = "image" | "video";

export interface PostMedia {
  _id?: Types.ObjectId;
  url: string;
  publicId: string;
  type: PostMediaType;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IPost extends Document {
  businessId: Types.ObjectId;

  title: string;

  content: string;

  type: PostType;

  status: PostStatus;

  isVisible: boolean;

  media: PostMedia[];

  hashtags: string[];

  productId?: Types.ObjectId;

  eventDate?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const postMediaSchema = new Schema<PostMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    alt: {
      type: String,
      trim: true,
      maxlength: 250,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
  },
);

const postSchema = new Schema<IPost>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    type: {
      type: String,
      enum: [
        "product_promotion",
        "announcement",
        "event",
        "product_launch",
        "special_offer",
        "business_news",
      ],
      required: true,
      default: "announcement",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    media: {
      type: [postMediaSchema],
      default: [],
    },

    hashtags: {
      type: [String],
      default: [],
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },

    eventDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({
  businessId: 1,
  status: 1,
  isVisible: 1,
});

postSchema.index({
  businessId: 1,
  createdAt: -1,
});

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;
