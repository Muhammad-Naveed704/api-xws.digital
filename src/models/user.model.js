import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    coverImage:{
      type : String
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken:{
      type : String
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};  
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ 
    id: this._id,
    email: this.email,
    name: this.name
  },
    process.env.ACCESS_TOKEN_SECRET, 
    {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  }
);
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
}

 const User = mongoose.model("User", userSchema);
 export default User;
