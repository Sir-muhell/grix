import mongoose, { Document, Schema } from "mongoose";

export interface ITicketLevel {
  name: string;
  price: number;
}

export interface IEvent extends Document {
  name: string;
  description: string;
  date: Date;
  location: string;
  ticketLevels: ITicketLevel[];
  createdBy: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "ended";
  createdAt: Date;
  updatedAt: Date;
  registrationCode: string;
}

const TicketLevelSchema = new Schema<ITicketLevel>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    ticketLevels: { type: [TicketLevelSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "ended"],
      default: "pending",
    },
    registrationCode: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", EventSchema);
