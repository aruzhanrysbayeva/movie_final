const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../services/emailService");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const PUBLIC_ROLES = ['user'];

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or username already exists'
      });
    }


    const safeRole = PUBLIC_ROLES.includes(role) ? role : 'user';

    const user = await User.create({
      username,
      email,
      password,
      role: safeRole
    });
    const token = generateToken(user._id);

    try {
      await sendWelcomeEmail({ to: user.email, username: user.username });
    } catch (emailError) {
      console.warn('Welcome email failed:', emailError.message);
    }

    res.status(201).json({
        user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = generateToken(user._id);
        
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
