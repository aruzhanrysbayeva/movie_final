const Movie = require('../models/movie');
const Watchlist = require("../models/watchlist");
exports.getMovieStats = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select("reviews");
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    const reviewCount = movie.reviews.length;
    const avgRating = reviewCount
      ? movie.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
      : 0;

    const counts = await Watchlist.aggregate([
      { $match: { movie: movie._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          plan_to_watch: { $sum: { $cond: [{ $eq: ["$status", "plan_to_watch"] }, 1, 0] } },
          watching: { $sum: { $cond: [{ $eq: ["$status", "watching"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          dropped: { $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] } },
          favorite: { $sum: { $cond: [{ $eq: ["$isFavorite", true] }, 1, 0] } }
        }
      }
    ]);

    const stats = counts[0] || {
      total: 0,
      plan_to_watch: 0,
      watching: 0,
      completed: 0,
      dropped: 0,
      favorite: 0
    };

    res.json({
      success: true,
      reviewCount,
      avgRating: Number(avgRating.toFixed(1)),
      watchlist: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (req.query.genre || req.query.genres) {
      const raw = req.query.genres || req.query.genre;
      const genres = Array.isArray(raw)
        ? raw
        : String(raw).split(',').map(g => g.trim()).filter(Boolean);
      if (genres.length) {
        query.genres = { $in: genres };
      }
    }
    
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }
    
    if (req.query.search) {
      const term = String(req.query.search).trim();
      if (term) {
        const regex = new RegExp(term, 'i');
        query.$or = [
          { title: regex },
          { cast: regex },
          { director: regex }
        ];
      }
    }

    let sort = {};
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    if (sortBy === 'popularity') {
      sort = { watchedCount: -1, reviewCount: -1 };
    } else if (sortBy === 'year') {
      sort = { year: sortOrder };
    } else if (sortBy === 'rating') {
      sort = { avgRating: sortOrder };
    } else if (req.query.sort) {
      const sortField = req.query.sort;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 };
    }

    const total = await Movie.countDocuments(query);

    let movies = [];
    if (sortBy === 'rating') {
      movies = await Movie.aggregate([
        { $match: query },
        {
          $addFields: {
            avgRating: {
              $cond: [
                { $gt: [{ $size: '$reviews' }, 0] },
                {
                  $round: [
                    {
                      $divide: [
                        { $sum: '$reviews.rating' },
                        { $size: '$reviews' }
                      ]
                    },
                    1
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]);
    } else {
      movies = await Movie.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
    }

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalMovies: total,
      movies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'username'
        }
      });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      success: true,
      movie
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();

    res.status(201).json({
      success: true,
      movie
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      success: true,
      movie
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
