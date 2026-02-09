const Watchlist = require('../models/watchlist');
const Movie = require('../models/movie');

exports.addToWatchlist = async (req, res) => {
  try {
    const { movieId, status, isFavorite } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const existingEntry = await Watchlist.findOne({
      user: req.user._id,
      movie: movieId
    });

    if (existingEntry) {
      if (status) existingEntry.status = status;
      if (typeof isFavorite === "boolean") existingEntry.isFavorite = isFavorite;
      await existingEntry.save();
      return res.json({ success: true, watchlistEntry: existingEntry });
    }

    const watchlistEntry = new Watchlist({
      user: req.user._id,
      movie: movieId,
      status: status || 'plan_to_watch',
      isFavorite: !!isFavorite
    });

    await watchlistEntry.save();

    res.status(201).json({
      success: true,
      watchlistEntry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const watchlist = await Watchlist.find(query)
      .populate({
        path: 'movie',
        select: 'title year posterUrl trailerUrl genres cast director extract'
      }).sort({ addedAt: -1 });

    res.json({
      success: true,
      count: watchlist.length,
      watchlist
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWatchlistStats = async (req, res) => {
  try {
    const stats = await Watchlist.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: stats.map(s => ({ status: s._id, count: s.count }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update watchlist entry
exports.updateWatchlistEntry = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['status', 'rating', 'watchedAt', 'notes'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const watchlistEntry = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!watchlistEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    updates.forEach(update => watchlistEntry[update] = req.body[update]);
    
    if (req.body.status === 'completed' && !watchlistEntry.watchedAt) {
      watchlistEntry.watchedAt = new Date();
    }

    await watchlistEntry.save();

    res.json({
      success: true,
      watchlistEntry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const watchlistEntry = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!watchlistEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
