import jwt, { JwtPayload } from "jsonwebtoken";

const JWT = process.env.JWT as string;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY as string;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as string;

// Function to generate a random string
function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
}

// Verify the token and return decoded data if valid, null if invalid
const VerifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export { VerifyToken };
