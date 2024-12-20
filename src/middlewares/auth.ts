import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string }; // Optional user property
    }
  }
}

interface DecodedToken {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract token from Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    // Verify token and attach user data to request
    const decoded = jwt.verify(token, process.env.JWT!);
    req.user = decoded as { id: string; role: string }; // Ensure user property matches your design
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access denied." });
      return;
    }
    next();
  };
};

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT!) as DecodedToken;

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token." });
  }
};
