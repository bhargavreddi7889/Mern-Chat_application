import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: "lax", // Always use lax in development
      secure: false, // Set to false in development
      path: "/",
    });

    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
};
