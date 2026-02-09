const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { 
  getAllMovies, 
  getMovieStats,
  getMovie, 
  createMovie, 
  updateMovie, 
  deleteMovie
} = require('../controllers/movieController');
const { movieValidation } = require('../middleware/validation');
const { addReview, getMovieReviews, updateReview, deleteReview} = require("../controllers/reviewController");

router.get("/:id/stats", getMovieStats);
router.get("/:id/reviews", getMovieReviews);
router.post("/:id/reviews", auth, addReview);
router.put("/:id/reviews/:reviewId", auth, updateReview);
router.delete("/:id/reviews/:reviewId", auth, deleteReview);

router.get('/', getAllMovies);
router.get('/:id', getMovie);

router.post('/', auth, authorize('admin'), movieValidation, createMovie);
router.put('/:id', auth, authorize('admin'), movieValidation, updateMovie);
router.delete('/:id', auth, authorize('admin'), deleteMovie);

module.exports = router;