import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);


app.use(
    express.json({
        limit: "20kb",
    })
);
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import 

import userRoutes from "./routes/user.routes.js";
import chatRoute from "./routes/chat.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import experenceRoutes from "./routes/experience.routes.js";
import projectsRoutes from "./routes/projects.routes.js";

// routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/chat", chatRoute);
app.use("/api/contact", contactRoutes);
app.use("/api/experience", experenceRoutes);
app.use("/api/projects", projectsRoutes);
export { app };
