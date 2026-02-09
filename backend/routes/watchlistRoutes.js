const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  addToWatchlist,
  getWatchlist,
  getWatchlistStats,
  updateWatchlistEntry,
  removeFromWatchlist
} = require('../controllers/watchlistController');

router.use(auth);

router.post('/', addToWatchlist);
router.get('/', getWatchlist);
router.get('/stats', authorize('premium', 'admin'), getWatchlistStats);
router.put('/:id', updateWatchlistEntry);
router.delete('/:id', removeFromWatchlist);

module.exports = router;
