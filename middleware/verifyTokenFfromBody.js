// middleware/verifyTokenFromBody.js
import jwt from "jsonwebtoken";

const verifyTokenFromBody = (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token missing in request body",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // optional
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default verifyTokenFromBody;
