const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  status: {
    type: String,
    enum: ['plan_to_watch', 'watching', 'completed', 'dropped', 'favorite'],
    default: 'plan_to_watch'
  },
  isFavorite: {
  type: Boolean,
  default: false
},
  addedAt: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  watchedAt: {
    type: Date
  },
  notes: {
    type: String
  }
});

watchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);