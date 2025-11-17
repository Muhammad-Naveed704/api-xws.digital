const ContactMessage = require( "../../models/portfolio-model/ContactMessage.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.createMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const doc = await ContactMessage.create({ name, email, message });

    // Send email via SMTP if configured, falling back to Ethereal (free test inbox)
    try {
      let transporter;
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Boolean(process.env.SMTP_SECURE === "true"),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Boolean(process.env.SMTP_SECURE === "true"),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          logger: true,
          debug: true,
        });
      }
      const to = process.env.CONTACT_INBOX || process.env.SMTP_USER;
      if (to) {
        const info = await transporter.sendMail({
          from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
          to,
          subject: `New message from ${name}`,
          text: `From: ${name} <${email}>
ID: ${doc._id}
---
${message}`,
        });
        const preview = nodemailer.getTestMessageUrl(info);
        res
          .status(201)
          .json({ message: "Message received", id: doc._id, preview });
        return;
      }
    } catch (mailErr) {
      // Non-fatal mail failure
      console.warn("Email send failed:", mailErr?.message);
    }

    res.status(201).json({ message: "Message received", id: doc._id });
  } catch (err) {
    next(err);
  }
}

exports.listMessages = async (req, res, next) => {
  try {
    const docs = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(docs);
  } catch (err) {
    next(err);
  }
}
