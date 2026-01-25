import mongoose from "mongoose";
import Message from "../models/Message.model.js";
import User from "../models/user.model.js";
// import User from '../models/User.js';

// List conversation previews for current user
export const listConversations = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Find latest message per peer
    const me = new mongoose.Types.ObjectId(userId);
    const lastPerPeer = await Message.aggregate([
      { $match: { $or: [ { senderId: me }, { receiverId: me } ] } },
      { $addFields: { peerId: { $cond: [ { $eq: ['$senderId', me] }, '$receiverId', '$senderId' ] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$peerId', last: { $first: '$$ROOT' }, unread: { $sum: { $cond: [ { $and: [ { $ne: ['$senderId', me] }, { $eq: ['$read', false] } ] }, 1, 0 ] } } } },
      { $limit: 100 },
    ]);

    const peerIds = lastPerPeer.map((d) => d._id);
    const users = await User.find({ _id: { $in: peerIds } }, { name: 1, email: 1 }).lean();
    const usersMap = new Map(users.map((u) => [String(u._id), u]));

    const data = lastPerPeer.map((d) => ({
      peer: usersMap.get(String(d._id)),
      lastMessage: d.last,
      unread: d.unread,
    }));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Messages between current user and peer
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const peerId = req.params.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const msgs = await Message.find({
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(1000);

    // mark as read where peer sent to me
    await Message.updateMany({ senderId: peerId, receiverId: userId, read: false }, { $set: { read: true } });

    res.json(msgs);
  } catch (err) {
    next(err);
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { receiverId, message } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!receiverId || !message) return res.status(400).json({ message: 'receiverId and message required' });
    const doc = await Message.create({ senderId: userId, receiverId, message });
    // emit to both users' rooms
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('chat:message', doc);
        io.to(`user:${receiverId}`).emit('chat:message', doc);
      }
    } catch {}
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

// Anonymous sender → admin (support)
export const sendAnonymousMessage = async (req, res, next) => {
  try {
    const { name, message, visitorKey } = req.body || {};
    if (!message) return res.status(400).json({ message: 'message required' });

    // Pick admin as receiver (support) - fallback to first user if no admin
    let admin = await User.findOne({ role: 'admin' }).lean();
    if (!admin) {
      // Fallback: use first user or create a support user
      admin = await User.findOne().lean();
      if (!admin) {
        return res.status(500).json({ message: 'No users configured' });
      }
    }

    // Find or create guest user
    const key = String(visitorKey || new mongoose.Types.ObjectId().toString());
    const guestEmail = `guest:${key}@anon.local`;
    let guest = await User.findOne({ email: guestEmail });
    if (!guest) {
      // Create guest user - password will be hashed by pre-save hook
      guest = await User.create({ 
        name: name || 'Guest', 
        email: guestEmail, 
        password: 'guest', 
        role: 'editor' 
      });
    } else if (name && guest.name !== name) {
      guest.name = name;
      await guest.save();
    }

    const doc = await Message.create({ senderId: guest._id, receiverId: admin._id, message });
    
    // Update online users map with guest name
    const onlineUsers = req.app.get('onlineUsers');
    if (onlineUsers && guest._id) {
      const existing = onlineUsers.get(String(guest._id));
      if (existing) {
        existing.name = guest.name;
      } else {
        onlineUsers.set(String(guest._id), {
          userId: String(guest._id),
          name: guest.name,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      }
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${String(admin._id)}`).emit('chat:message', doc);
        io.to(`user:${String(guest._id)}`).emit('chat:message', doc);
      }
    } catch {}

    // Return message with visitorKey for frontend to store
    const response = doc.toObject ? doc.toObject() : doc;
    response.visitorKey = key;
    response.guestUserId = String(guest._id);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

// Anonymous history by visitorKey
export const getAnonymousMessages = async (req, res, next) => {
  try {
    const { visitorKey } = req.query;
    if (!visitorKey) return res.status(400).json({ message: 'visitorKey required' });
    const guestEmail = `guest:${String(visitorKey)}@anon.local`;
    const guest = await User.findOne({ email: guestEmail }).lean();
    if (!guest) return res.json({ guestUserId: null, messages: [] });
    let admin = await User.findOne({ role: 'admin' }).lean();
    if (!admin) {
      admin = await User.findOne().lean();
      if (!admin) return res.json({ guestUserId: String(guest._id), messages: [] });
    }
    const msgs = await Message.find({
      $or: [
        { senderId: guest._id, receiverId: admin._id },
        { senderId: admin._id, receiverId: guest._id },
      ],
    }).sort({ createdAt: 1 }).limit(1000);
    res.json({ guestUserId: String(guest._id), messages: msgs });
  } catch (err) {
    next(err);
  }
}

// Initialize guest user
export const initializeGuestUser = async (req, res, next) => {
  try {
    const { name, visitorKey } = req.body || {};
    const key = String(visitorKey || new mongoose.Types.ObjectId().toString());
    const guestEmail = `guest:${key}@anon.local`;
    
    let guest = await User.findOne({ email: guestEmail });
    if (!guest) {
      // Create guest user - password will be hashed by pre-save hook
      guest = await User.create({ 
        name: name || `User${Math.floor(Math.random() * 10000)}`, 
        email: guestEmail, 
        password: 'guest', 
        role: 'editor' 
      });
    } else if (name && guest.name !== name) {
      guest.name = name;
      await guest.save();
    }

    // Update online users map
    const onlineUsers = req.app.get('onlineUsers');
    if (onlineUsers) {
      onlineUsers.set(String(guest._id), {
        userId: String(guest._id),
        name: guest.name,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });
    }

    res.json({ 
      userId: String(guest._id), 
      name: guest.name, 
      visitorKey: key 
    });
  } catch (err) {
    next(err);
  }
}

// Get online users
export const getOnlineUsers = async (req, res, next) => {
  try {
    const { visitorKey } = req.query || {};
    const onlineUsers = req.app.get('onlineUsers');
    
    if (!onlineUsers) {
      return res.json([]);
    }

    // Get all online users from map
    const users = Array.from(onlineUsers.values())
      .filter(user => user.isOnline)
      .map(user => ({
        userId: user.userId,
        name: user.name,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      }));

    // Also include guest users from database if visitorKey matches
    if (visitorKey) {
      const guestEmail = `guest:${visitorKey}@anon.local`;
      const guest = await User.findOne({ email: guestEmail }).lean();
      if (guest) {
        const guestId = String(guest._id);
        const exists = users.find(u => u.userId === guestId);
        if (!exists) {
          users.push({
            userId: guestId,
            name: guest.name,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
}

// Send guest-to-guest message
export const sendGuestMessage = async (req, res, next) => {
  try {
    const { receiverId, message, visitorKey } = req.body || {};
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'receiverId and message required' });
    }

    // Find sender guest user
    const key = String(visitorKey || new mongoose.Types.ObjectId().toString());
    const guestEmail = `guest:${key}@anon.local`;
    let guest = await User.findOne({ email: guestEmail });
    
    if (!guest) {
      // Create guest if doesn't exist - password will be hashed by pre-save hook
      guest = await User.create({ 
        name: `User${Math.floor(Math.random() * 10000)}`, 
        email: guestEmail, 
        password: 'guest', 
        role: 'editor' 
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId).lean();
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const doc = await Message.create({ 
      senderId: guest._id, 
      receiverId: receiverId, 
      message 
    });

    // Update online users
    const onlineUsers = req.app.get('onlineUsers');
    if (onlineUsers) {
      const existing = onlineUsers.get(String(guest._id));
      if (existing) {
        existing.name = guest.name;
      } else {
        onlineUsers.set(String(guest._id), {
          userId: String(guest._id),
          name: guest.name,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      }
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${String(guest._id)}`).emit('chat:message', doc);
        io.to(`user:${receiverId}`).emit('chat:message', doc);
      }
    } catch {}

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

// Get messages between guest and another user
export const getGuestMessages = async (req, res, next) => {
  try {
    const { visitorKey } = req.query || {};
    const peerId = req.params.userId;
    
    if (!visitorKey) {
      return res.status(400).json({ message: 'visitorKey required' });
    }

    const guestEmail = `guest:${String(visitorKey)}@anon.local`;
    const guest = await User.findOne({ email: guestEmail }).lean();
    
    if (!guest) {
      return res.json([]);
    }

    const msgs = await Message.find({
      $or: [
        { senderId: guest._id, receiverId: peerId },
        { senderId: peerId, receiverId: guest._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(1000);

    // Mark as read where peer sent to guest
    await Message.updateMany(
      { senderId: peerId, receiverId: guest._id, read: false },
      { $set: { read: true } }
    );

    res.json(msgs);
  } catch (err) {
    next(err);
  }
}

export default { 
  listConversations, 
  getMessages, 
  sendMessage, 
  sendAnonymousMessage, 
  getAnonymousMessages,
  initializeGuestUser,
  getOnlineUsers,
  sendGuestMessage,
  getGuestMessages,
};


