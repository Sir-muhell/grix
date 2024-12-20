import { Request, Response } from "express";
import User, { IUser } from "../models/user";
import Event, { IEvent } from "../models/event";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validate from "../config/validate";
import { RequestError } from "../config/handler";

import {
  changePasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "../schemas/user";
import nodemailer from "nodemailer";
import sendEmail from "../config/mail";

const JWT = process.env.JWT!;

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = validate(registerUserSchema, req.body);
    const { name, email, password, role, company, companyId } = data;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    if (role === "BASE_USER") {
      const eventOwner = await User.findOne({ companyId: companyId });
      if (!eventOwner || eventOwner.role !== "EVENT_OWNER") {
        res.status(400).json({ message: "Invalid company (event owner)" });
        return;
      }
    }

    let companyIdn;
    if (role === "EVENT_OWNER" && !company) {
      res
        .status(400)
        .json({ message: "Company name is required for event owners" });
      return;
    } else if (role === "EVENT_OWNER") {
      //10 digit random code
      const randomNumber = Math.floor(Math.random() * 10000000000);
      companyIdn = randomNumber.toString().padStart(10, "0");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser: IUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      company: role === "EVENT_OWNER" ? company : company || undefined,
      companyId:
        role === "EVENT_OWNER"
          ? companyIdn
          : role === "BASE_USER"
          ? companyId
          : undefined,
      status: role === "SUPER_ADMIN" ? "approved" : "pending",
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = validate(loginUserSchema, req.body);
    const { email, password } = data;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Check if the user is approved (for base users)
    if (user.status === "pending") {
      res.status(400).json({
        message: "Your account is pending approval by admin.",
      });

      return;
    }

    if (user.status === "suspended") {
      res.status(400).json({ message: "Your account is suspended." });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        company: user.company,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = req.user!.id;
  const adminRole = req.user!.role;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Super Admin can approve any user
    if (adminRole === "SUPER_ADMIN") {
      user.status = "approved";
    }
    // Event Owners can approve only their Base Users
    else if (
      adminRole === "EVENT_OWNER" &&
      user.role === "BASE_USER" &&
      user.company === adminId
    ) {
      user.status = "approved";
    } else {
      res
        .status(403)
        .json({ message: "You are not authorized to approve this user" });
      return;
    }

    await user.save();
    res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const suspendUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = req.user!.id;
  const adminRole = req.user!.role;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Super Admin can suspend any user
    if (adminRole === "SUPER_ADMIN") {
      user.status = "suspended";
    }
    // Event Owners can suspend only their Base Users
    else if (
      adminRole === "EVENT_OWNER" &&
      user.role === "BASE_USER" &&
      user.company === adminId
    ) {
      user.status = "suspended";
    } else {
      res
        .status(403)
        .json({ message: "You are not authorized to suspend this user" });
      return;
    }

    await user.save();
    res.status(200).json({ message: "User suspended successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const recoverPassword = async (req: Request, res: Response) => {
  const data = validate(resetPasswordRequestSchema, req.body);
  const { email } = data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const token = (Math.floor(Math.random() * 90000) + 10000).toString();
    const expiryTime = Date.now() + 3600000; // Token expires in 1 hour

    await User.updateOne(
      { email },
      { $set: { resetToken: token, resetTokenExpiry: expiryTime } }
    );

    res.on("finish", () => {
      sendEmail(email, "Password Change Request", "password-reset.html", {
        name: user.name,
        otp: token,
      });
    });

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const data = validate(resetPasswordSchema, req.body);
    const { email, token, password: plainTextPassword } = data;
    const user = await User.findOne({ email }).lean();

    if (!user) {
      throw new RequestError("Invalid entry", 422, {
        email: "Email does not exist",
      });
    }

    if (
      user.resetToken !== token ||
      !user.resetTokenExpiry ||
      new Date(user.resetTokenExpiry as number) < new Date()
    ) {
      throw new RequestError("Invalid entry", 422, {
        token: "Invalid or expired token",
      });
    }

    const password = await bcrypt.hash(plainTextPassword, 10);
    await User.updateOne(
      { email },
      { $set: { password, resetToken: null, resetTokenExpiry: null } }
    );

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const data = validate(changePasswordSchema, req.body);
    const { old_password, new_password } = data;

    const user = await User.findById(req.user!.id);

    if (!user) {
      throw new RequestError("Invalid entry", 422, {
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(old_password, user.password);
    if (!isPasswordValid) {
      throw new RequestError("Invalid entry", 422, {
        old_password: "This password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllEventOwners = async (req: Request, res: Response) => {
  const { role } = req.user!;

  try {
    // Only Super Admin can fetch Event Owners
    if (role !== "SUPER_ADMIN") {
      res
        .status(403)
        .json({ message: "You are not authorized to access this resource." });
      return;
    }

    // Fetch all Event Owners
    const eventOwners = await User.find({ role: "EVENT_OWNER" }).select(
      "-password"
    );
    res.status(200).json({ eventOwners });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getBaseUsers = async (req: Request, res: Response) => {
  const { id: requesterId, role } = req.user!;

  try {
    // Super Admin can fetch all Base Users
    if (role === "SUPER_ADMIN") {
      const baseUsers = await User.find({ role: "BASE_USER" }).select(
        "-password"
      );
      res.status(200).json({ baseUsers });
      return;
    }

    // Event Owner can only fetch Base Users tied to their companyId
    if (role === "EVENT_OWNER") {
      const eventOwner = await User.findById(requesterId);
      if (!eventOwner) {
        res.status(400).json({ message: "Event owner not found." });
        return;
      }
      const companyId = eventOwner.companyId;
      console.log(companyId);
      const baseUsers = await User.find({
        role: "BASE_USER",
        companyId: companyId,
      }).select("-password");
      res.status(200).json({ baseUsers });
      return;
    }

    res
      .status(403)
      .json({ message: "You are not authorized to access this resource." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
