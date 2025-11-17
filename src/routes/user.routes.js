import { Router } from "express";
import { registerUser, loginUser ,logoutUser , getUsers , refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken)
// secure routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/getall", verifyJWT, getUsers);


export default router;
