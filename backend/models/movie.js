const mongoose=require('mongoose');
const reviewSchema=mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    username: {
        type: String,
        required: true
    },
     rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
    created_at:{
        type: Date,
        default: Date.now
    }
},{
    _id: true}
);

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: 'text'
    },
    year:{
        type: Number, 
        required: true
    },
    cast:[{
        type: String
    }],
    director:[{
        type: String
    }],
    genres: [{
        type: String
    }],
    extract: {
        type: String,
        required: true
    },
    posterUrl:{
        type: String
    },
    trailerUrl:{
        type: String
    },
    reviews: [reviewSchema],
    reviewCount: {
        type: Number,
        default: 0,
        index: true
    },
    watchedCount: {
        type: Number,
        default: 0,
        index: true
    },
    planningCount: {
        type: Number,
        default: 0
    },
    droppedCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
movieSchema.pre('save', function() {
    this.reviewCount = this.reviews.length;})

module.exports = mongoose.model('Movie', movieSchema);