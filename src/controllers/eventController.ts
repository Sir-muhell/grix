import { Request, Response } from "express";
import Event, { IEvent } from "../models/event";
import { v4 as uuidv4 } from "uuid";

export const createEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, description, date, location, ticketLevels } = req.body;
  const registrationCode = uuidv4();

  try {
    if (
      !ticketLevels ||
      !Array.isArray(ticketLevels) ||
      ticketLevels.length === 0
    ) {
      res
        .status(400)
        .json({ message: "At least one ticket level is required." });
      return;
    }

    const newEvent: IEvent = new Event({
      name,
      description,
      date,
      location,
      ticketLevels,
      createdBy: req.user!.id,
      registrationCode,
    });

    await newEvent.save();

    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
