const Movie= require("../models/movie");

exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    const alreadyReviewed = movie.reviews.some(
      (r) => r.userId.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ error: "You already reviewed this movie. You may update old one!" });
    }


    movie.reviews.push({
      userId: req.user.id,
      username: req.user.username,
      comment,
      rating
    });

    await movie.save();
    res.status(201).json({ success: true, reviews: movie.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    const review = movie.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const isOwner = review.userId.toString() === req.user.id;
    const isElevated = req.user.role === "admin";
    if (!isOwner && !isElevated) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await movie.save();
    res.json({ success: true, reviews: movie.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    const review = movie.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const isOwner = review.userId.toString() === req.user.id;
    const isElevated = req.user.role === "admin";
    if (!isOwner && !isElevated) {
      return res.status(403).json({ error: "Forbidden" });
    }

    review.deleteOne();
    await movie.save();

    res.json({ success: true, reviews: movie.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getMovieReviews = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select("reviews");
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ success: true, reviews: movie.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
