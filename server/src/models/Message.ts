import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage extends Document {
  conversationId?: Types.ObjectId;
  senderId?: Types.ObjectId;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      default: 'user',
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
