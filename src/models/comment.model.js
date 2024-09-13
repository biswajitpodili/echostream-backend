import { Schema, model } from "mongoose";

const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    
  }
});

export const Comment = model("Comment", commentSchema);
