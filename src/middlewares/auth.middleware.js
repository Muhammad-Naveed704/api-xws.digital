import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import  User  from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "invalid token unauthorized");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "invalid token user not found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message, "invalid token");
  }
});
