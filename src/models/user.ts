import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "EVENT_OWNER" | "BASE_USER";
  company?: string; // Company name for event owners or event reference for base users
  companyId?: string;
  status: "pending" | "approved" | "suspended";
  resetToken?: String;
  resetTokenExpiry?: Number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "EVENT_OWNER", "BASE_USER"],
      required: true,
    },
    company: { type: String }, // Optional: Assigned only for Event Owners or Base Users
    companyId: { type: String }, // Optional: Assigned only for Event Owners or Base Users
    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
    },
    resetToken: { type: String },
    resetTokenExpiry: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
