import mongoose, {
  Document,
  Schema,
  Types,
} from 'mongoose';

export interface ICategory extends Document {
  businessId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema =
  new Schema<ICategory>(
    {
      businessId: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
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
        trim: true,
        lowercase: true,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    },
  );

categorySchema.index(
  {
    businessId: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

const Category =
  mongoose.model<ICategory>(
    'Category',
    categorySchema,
  );

export default Category;