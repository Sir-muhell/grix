import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  console.log(mongoUri);

  if (!mongoUri) {
    throw new Error("MongoDB URI is not defined in the environment variables");
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`Mongo db connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("===========", error);
    process.exit(1);
  }
};

export { connectDB };
