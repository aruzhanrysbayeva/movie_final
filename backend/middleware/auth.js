const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) throw new Error();
        
        req.user = user;
        req.token = token;
        req.userId = user._id;
        req.userRole = user.role;  
        req.isAdmin = user.role === 'admin';  
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
    }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (roles.length === 0) return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = { auth, authorize };