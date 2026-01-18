const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getJWTSecret } = require('../utils/auth');

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Get list of admins (for users)
router.get('/admins', authenticate, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('_id username email')
      .lean();

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send a message (user to admin or admin to user)
router.post('/send', authenticate, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Get sender info
    const sender = await User.findById(req.userId);
    if (!sender) {
      return res.status(404).json({ message: 'Người gửi không tồn tại' });
    }

    // Get receiver info
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Người nhận không tồn tại' });
    }

    // Validate: User can only message admin, Admin can message anyone
    if (sender.role === 'user' && receiver.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn chỉ có thể gửi tin nhắn cho admin' });
    }

    // Create message
    const newMessage = await Message.create({
      senderId: sender._id,
      senderName: sender.username,
      receiverId: receiver._id,
      receiverName: receiver.username,
      message: message.trim()
    });

    res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get messages between current user and another user
router.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Get messages where current user is sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: req.userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      messages,
      page,
      totalPages: Math.ceil(messages.length / limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations for current user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Convert req.userId to ObjectId for proper matching
    const currentUserId = new mongoose.Types.ObjectId(req.userId);

    // Get all unique user IDs that current user has conversations with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          userIds: {
            $addToSet: {
              $cond: [
                { $eq: ['$senderId', currentUserId] },
                '$receiverId',
                '$senderId'
              ]
            }
          }
        }
      }
    ]);

    const userIds = conversations[0]?.userIds || [];
    
    // Get latest message for each conversation
    const conversationList = await Promise.all(
      userIds.map(async (otherUserId) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId }
          ]
        })
          .sort({ createdAt: -1 })
          .lean();

        const otherUser = await User.findById(otherUserId).select('username email role').lean();
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          senderId: otherUserId,
          receiverId: currentUserId,
          isRead: false
        });

        return {
          userId: otherUserId.toString(), // Convert to string for consistency
          userName: otherUser?.username || 'Unknown',
          userEmail: otherUser?.email || '',
          userRole: otherUser?.role || 'user',
          lastMessage: latestMessage?.message || '',
          lastMessageTime: latestMessage?.createdAt || null,
          unreadCount
        };
      })
    );

    // Sort by last message time (newest first)
    conversationList.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    res.json({ conversations: conversationList });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count for current user
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.userId,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete conversation between current user and another user
router.delete('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Get current user to check role
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Only admin can delete conversations
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xóa cuộc trò chuyện' });
    }

    // Delete all messages between current user and other user
    const result = await Message.deleteMany({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ]
    });

    res.json({
      message: 'Đã xóa cuộc trò chuyện thành công',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

