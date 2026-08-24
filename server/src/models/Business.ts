import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose";

export type BusinessStatus =
  | "active"
  | "suspended"
  | "pending";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface OperatingHoursDay {
  isOpen: boolean;
  open?: string;
  close?: string;
}

export type OperatingHours = Record<
  DayOfWeek,
  OperatingHoursDay
>;

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
}

export interface IBusiness extends Document {
  ownerId: Types.ObjectId;

  name: string;
  slug: string;
  description?: string;

  email: string;
  phone?: string;
  whatsappNumber?: string;

  category?: string;

  location?: {
    country: string;
    district?: string;
    city?: string;
    address?: string;
  };

  operatingHours?: OperatingHours;

  socialLinks?: SocialLinks;

  logo?: string;
  coverImage?: string;
  website?: string;

  /**
   * Controlled by platform administrators.
   * Business owners cannot set this themselves.
   */
  isFeatured: boolean;

  status: BusinessStatus;

  createdAt: Date;
  updatedAt: Date;
}

const operatingHoursDaySchema =
  new Schema<OperatingHoursDay>(
    {
      isOpen: {
        type: Boolean,
        default: true,
      },

      open: {
        type: String,
        trim: true,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
      },

      close: {
        type: String,
        trim: true,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
      },
    },
    {
      _id: false,
    },
  );

const operatingHoursSchema =
  new Schema<OperatingHours>(
    {
      monday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "08:00",
          close: "17:00",
        }),
      },

      tuesday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "08:00",
          close: "17:00",
        }),
      },

      wednesday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "08:00",
          close: "17:00",
        }),
      },

      thursday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "08:00",
          close: "17:00",
        }),
      },

      friday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "08:00",
          close: "17:00",
        }),
      },

      saturday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: true,
          open: "09:00",
          close: "15:00",
        }),
      },

      sunday: {
        type: operatingHoursDaySchema,
        default: () => ({
          isOpen: false,
        }),
      },
    },
    {
      _id: false,
    },
  );

const socialLinksSchema =
  new Schema<SocialLinks>(
    {
      facebook: {
        type: String,
        trim: true,
      },

      instagram: {
        type: String,
        trim: true,
      },

      linkedin: {
        type: String,
        trim: true,
      },

      tiktok: {
        type: String,
        trim: true,
      },

      x: {
        type: String,
        trim: true,
      },
    },
    {
      _id: false,
    },
  );

const businessSchema = new Schema<IBusiness>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    whatsappNumber: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    location: {
      country: {
        type: String,
        default: "Uganda",
        trim: true,
      },

      district: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      address: {
        type: String,
        trim: true,
      },
    },

    operatingHours: {
      type: operatingHoursSchema,
      default: () => ({}),
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    logo: {
      type: String,
      trim: true,
    },

    coverImage: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "suspended",
        "pending",
      ],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Business = mongoose.model<IBusiness>(
  "Business",
  businessSchema,
);

export default Business;