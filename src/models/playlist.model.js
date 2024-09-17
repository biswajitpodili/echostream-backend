import { Schema, model } from "mongoose";

const playlistScheme = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Playlist = model("Playlist", playlistScheme);
