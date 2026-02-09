if (window.__movieshelfInit) {
  console.warn("MovieShelf already initialized");
} else {
  window.__movieshelfInit = true;
  (() => {

const API_BASE = "http://localhost:5001/api/auth";

const registerForm = document.getElementById("register-form-elements");
const registerAlert = document.getElementById("register-alert");
const loginAlert = document.getElementById("login-alert");
const loginForm =
  document.getElementById("login-form-elements") ||
  document.getElementById("login-form");
const toast = document.getElementById("toast");
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
  }
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

function showToast(message, success = true) {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${success ? "success" : "error"}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function showRegisterError(message) {
  if (!registerAlert) return;
  registerAlert.textContent = message;
  registerAlert.style.display = "block";
}

function showLoginError(message) {
  if (!loginAlert) return;
  loginAlert.textContent = message;
  loginAlert.style.display = "block";
}
//block pages if not logged in
const protectedPages = ["profile.html", "watchlist.html", "movies.html"];
const currentPageName = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPageName)) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login", false);
    setTimeout(() => (window.location.href = "login.html"), 1200);
    throw new Error("Not logged in"); 
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractError(data) {
  if (!data) return "Request failed";
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  return "Request failed";
}

// register
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerAlert) registerAlert.style.display = "none";
    const username = document.getElementById("register-name")?.value.trim();
    const email = document.getElementById("register-email")?.value.trim();
    const password = document.getElementById("register-password")?.value;

    if (!username || !email || !password) {
      showToast("All fields are required", false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        const msg = extractError(data) || "Registration failed";
        showRegisterError(msg);
        showToast(msg, false);
        return;
      }

      showToast("Registration successful");
      if (data?.token) localStorage.setItem("token", data.token);
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch {
      showToast("Network error. Is the server running?", false);
    }
  });
}

// login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginAlert) loginAlert.style.display = "none";
    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
      showToast("Email and password are required", false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        const msg = extractError(data) || "Login failed";
        showLoginError(msg);
        showToast(msg, false);
        return;
      }

      showToast("Login successful");
      if (data?.token) localStorage.setItem("token", data.token);
      setTimeout(() => (window.location.href = "profile.html"), 1200);
    } catch {
      showToast("Network error. Is the server running?", false);
    }
  });
}

//change login to profile navlink
const loginNavLinks = Array.from(document.querySelectorAll('a[href="login.html"]'));
const storedToken = localStorage.getItem("token");
if (loginNavLinks.length > 0 && storedToken) {
  loginNavLinks.forEach((link) => {
    link.href = "profile.html";
    link.innerHTML = '<i class="fas fa-user"></i> Profile';
    link.classList.remove("active");
    if (window.location.pathname.endsWith("profile.html")) link.classList.add("active");
  });
}

// profile
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const logoutBtn = document.getElementById("logout-btn");

if (profileName || profileEmail || profileRole) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  } else {
    fetch("http://localhost:5001/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        const data = await safeJson(res);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return null;
          }
          throw new Error(extractError(data));
        }
        return data;
      })
      .then((user) => {
        if (!user) return;
        if (profileName) profileName.textContent = user.username || "User";
        if (profileEmail) profileEmail.textContent = user.email || "";
        if (profileRole) profileRole.textContent = `role: ${user.role || "user"}`;
        const premiumBadge = document.getElementById("premium-badge");
        if (premiumBadge) {
          premiumBadge.style.display = user.role === "premium" ? "inline-flex" : "none";
        }
      })
      .catch((err) => showToast(err?.message || "Failed to load profile", false));
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}

// update profile
const profileForm = document.getElementById("profile-form");
const usernameInput = document.getElementById("profile-username");
const emailInput = document.getElementById("profile-email-input");
const updateBtn = document.getElementById("updateBtn");

if (updateBtn && profileForm) {
  updateBtn.addEventListener("click", () => {
    const isHidden = profileForm.style.display === "none";
    profileForm.style.display = isHidden ? "block" : "none";
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "login.html");

    const username = usernameInput?.value.trim();
    const email = emailInput?.value.trim();
    if (!username || !email) {
      showToast("Username and email are required", false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, email })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "login.html";
          return;
        }
        throw new Error(extractError(data));
      }

      showToast("Profile updated successfully!");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast(err?.message || "Failed to update", false);
    }
  });
}

// add movie modal
const addMovieBtn = document.getElementById("add-movie-btn");
const addMovieForm = document.getElementById("add-movie-form");
const addMovieModal = document.getElementById("add-movie-modal");
const closeMovieModal = document.getElementById("close-movie-modal");

if (addMovieBtn && addMovieModal) {
  addMovieBtn.addEventListener("click", () => {
    addMovieModal.style.display = "flex";
  });
}

if (closeMovieModal && addMovieModal) {
  closeMovieModal.addEventListener("click", () => {
    addMovieModal.style.display = "none";
  });
}

if (addMovieModal) {
  addMovieModal.addEventListener("click", (e) => {
    if (e.target === addMovieModal) addMovieModal.style.display = "none";
  });
}

// add button only for admin
if (addMovieBtn || addMovieForm) {
  const token = localStorage.getItem("token");
  if (!token) {
    if (addMovieBtn) addMovieBtn.style.display = "none";
  } else {
    fetch("http://localhost:5001/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((user) => {
        if (user?.role === "admin") {
          if (addMovieBtn) addMovieBtn.style.display = "inline-block";
        }
      });
  }
}

//movie rating and etc, stats
async function loadMovieStats(movieId) {
  const res = await fetch(`http://localhost:5001/api/movies/${movieId}/stats`);
  const data = await safeJson(res);
  if (!res.ok || !data) return;

  if (detailsRating) {
    detailsRating.textContent = `Average Rating: ${data.avgRating || 0}`;
  }
  if (detailsReviewCount) {
    detailsReviewCount.textContent = `Reviews: ${data.reviewCount || 0}`;
  }
  if (detailsWatchlistCount) {
    const w = data.watchlist || {};
    detailsWatchlistCount.innerHTML = `
        Watchlist: ${w.total || 0}<br>
        Plan: ${w.plan_to_watch || 0}<br>
        Watching: ${w.watching || 0}<br>
        Completed: ${w.completed || 0}<br>
        Dropped: ${w.dropped || 0}<br>
        Favorites: ${w.favorite || 0}
    `;
}
}


// submit new movie
if (addMovieForm) {
  addMovieForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const title = document.getElementById("movie-title").value.trim();
    const year = Number(document.getElementById("movie-year").value);
    const genres = document.getElementById("movie-genres").value.split(",").map(g => g.trim()).filter(Boolean);
    const cast = document.getElementById("movie-cast").value.split(",").map(c => c.trim()).filter(Boolean);
    const director = document.getElementById("movie-director").value.split(",").map(d => d.trim()).filter(Boolean);
    const posterUrl = document.getElementById("movie-poster").value.trim();
    const trailerUrl = document.getElementById("movie-trailer").value.trim();
    const extract = document.getElementById("movie-extract").value.trim();

    const res = await fetch("http://localhost:5001/api/movies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, year, genres, cast, director, posterUrl, trailerUrl, extract })
    });

    if (res.ok) {
      showToast("Movie added");
      addMovieForm.reset();
      setTimeout(() => window.location.reload(), 800);
    } else {
      const data = await safeJson(res);
      showToast(extractError(data) || "Failed to add movie", false);
    }
  });
}

// movie list + search
const moviesList = document.getElementById("movies-list");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const filterPopularity = document.getElementById("filter-popularity");
const filterYear = document.getElementById("filter-year");
const filterRating = document.getElementById("filter-rating");
const filterGenre = document.getElementById("filter-genre");
const addGenreBtn = document.getElementById("add-genre");
const genreChips = document.getElementById("genre-chips");
const applyFiltersBtn = document.getElementById("apply-filters");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const resultsCount = document.getElementById("results-count");

let currentPage = 1;
let totalPages = 1;
let currentSearch = "";
let currentSortBy = "";
let currentGenre = "";
let selectedGenres = [];
const PAGE_LIMIT = 12;
let searchDebounce = null;

function renderMovies(movies) {
  if (!moviesList) return;
  if (movies.length === 0) {
    moviesList.innerHTML = "<p>No movies found</p>";
    return;
  }

  moviesList.innerHTML = movies.map((movie) => {
    const poster = movie.posterUrl ? `style="background-image:url('${movie.posterUrl}')"` : "";
    const title = movie.title || "Untitled";
    const placeholder = title[0] || "M";

    return `
      <div class="movie-card">
        <div class="movie-card-poster" ${poster}>
          ${movie.posterUrl ? "" : `<span class="movie-card-placeholder-text">${placeholder}</span>`}
        </div>
        <div class="movie-card-overlay">
          <div class="movie-card-header">
            <h3>${title}</h3>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".movie-card").forEach((card, i) => {
    card.addEventListener("click", () => openDetailsModal(movies[i]));
  });
}

function fetchMovies(searchTerm = "", sortBy = "", genre = "", page = 1) {
  if (!moviesList) return;
  let url = "http://localhost:5001/api/movies";
  const params = new URLSearchParams();
  if (searchTerm) params.set("search", searchTerm);
  if (sortBy) params.set("sortBy", sortBy);
  if (genre) params.set("genre", genre);
  params.set("page", String(page));
  params.set("limit", String(PAGE_LIMIT));
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const movies = data?.movies || [];
      currentPage = data?.page || page;
      totalPages = data?.totalPages || 1;
      if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      }
      if (resultsCount) {
        resultsCount.textContent = `Total: ${data?.totalMovies ?? 0}`;
      }
      if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
      if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
      renderMovies(movies);
    })
    .catch(() => {
      moviesList.innerHTML = "<p>Failed to load movies</p>";
    });
}

if (moviesList) {
  fetchMovies();
}

if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const term = searchInput.value.trim();
    const sortBy = filterPopularity?.checked
      ? "popularity"
      : filterYear?.checked
        ? "year"
        : filterRating?.checked
          ? "rating"
        : "";
    currentSearch = term;
    currentSortBy = sortBy;
    currentGenre = selectedGenres.length
      ? selectedGenres.join(",")
      : filterGenre?.value.trim() || "";
    fetchMovies(currentSearch, currentSortBy, currentGenre, 1);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sortBy = filterPopularity?.checked
        ? "popularity"
        : filterYear?.checked
          ? "year"
          : filterRating?.checked
            ? "rating"
          : "";
      currentSearch = searchInput.value.trim();
      currentSortBy = sortBy;
      currentGenre = selectedGenres.length
        ? selectedGenres.join(",")
        : filterGenre?.value.trim() || "";
      fetchMovies(currentSearch, currentSortBy, currentGenre, 1);
    }
  });
}

function enforceSingleFilter(active) {
  if (active === "popularity" && filterPopularity?.checked && filterYear) {
    filterYear.checked = false;
  }
  if (active === "year" && filterYear?.checked && filterPopularity) {
    filterPopularity.checked = false;
  }
  if (active === "rating" && filterRating?.checked) {
    if (filterPopularity) filterPopularity.checked = false;
    if (filterYear) filterYear.checked = false;
  }
}

if (filterPopularity) {
  filterPopularity.addEventListener("change", () => enforceSingleFilter("popularity"));
}
if (filterYear) {
  filterYear.addEventListener("change", () => enforceSingleFilter("year"));
}
if (filterRating) {
  filterRating.addEventListener("change", () => enforceSingleFilter("rating"));
}

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener("click", () => {
    const term = searchInput?.value.trim() || "";
    const sortBy = filterPopularity?.checked
      ? "popularity"
      : filterYear?.checked
        ? "year"
        : filterRating?.checked
          ? "rating"
        : "";
    currentSearch = term;
    currentSortBy = sortBy;
    currentGenre = selectedGenres.length
      ? selectedGenres.join(",")
      : filterGenre?.value.trim() || "";
    fetchMovies(currentSearch, currentSortBy, currentGenre, 1);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      currentSortBy = filterPopularity?.checked
        ? "popularity"
        : filterYear?.checked
          ? "year"
          : filterRating?.checked
            ? "rating"
          : "";
      currentGenre = selectedGenres.length
        ? selectedGenres.join(",")
        : filterGenre?.value.trim() || "";
      fetchMovies(currentSearch, currentSortBy, currentGenre, 1);
    }, 350);
  });
}

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage <= 1) return;
    fetchMovies(currentSearch, currentSortBy, currentGenre, currentPage - 1);
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    if (currentPage >= totalPages) return;
    fetchMovies(currentSearch, currentSortBy, currentGenre, currentPage + 1);
  });
}

function renderGenreChips() {
  if (!genreChips) return;
  genreChips.innerHTML = selectedGenres.map((g) => {
    return `<span class="genre-chip" data-genre="${g}">${g}<button type="button">&times;</button></span>`;
  }).join("");

  genreChips.querySelectorAll(".genre-chip button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const chip = e.target.closest(".genre-chip");
      const genre = chip?.dataset.genre;
      if (!genre) return;
      selectedGenres = selectedGenres.filter((g) => g !== genre);
      renderGenreChips();
      currentGenre = selectedGenres.length ? selectedGenres.join(",") : "";
      fetchMovies(currentSearch, currentSortBy, currentGenre, 1);
    });
  });
}

function addGenreChip() {
  const value = filterGenre?.value.trim();
  if (!value) return;
  if (!selectedGenres.includes(value)) {
    selectedGenres.push(value);
    renderGenreChips();
  }
  if (filterGenre) filterGenre.value = "";
}

if (addGenreBtn) {
  addGenreBtn.addEventListener("click", () => {
    addGenreChip();
  });
}

if (filterGenre) {
  filterGenre.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addGenreChip();
    }
  });
}

// movie details
const detailsModal = document.getElementById("movie-details-modal");
const closeDetailsModal = document.getElementById("close-details-modal");

const detailsTitle = document.getElementById("details-title");
const detailsPoster = document.getElementById("details-poster");
const detailsYear = document.getElementById("details-year");
const detailsGenres = document.getElementById("details-genres");
const detailsCast = document.getElementById("details-cast");
const detailsDirector = document.getElementById("details-director");
const detailsExtract = document.getElementById("details-extract");
const detailsRating = document.getElementById("details-rating");
const detailsReviewCount = document.getElementById("details-review-count");
const detailsWatchlistCount = document.getElementById("details-watchlist-count");

const trailerWrap = document.getElementById("details-trailer-wrap");
const trailerIframe = document.getElementById("details-trailer-iframe");

let selectedMovie = null;

const detailsActions = document.getElementById("details-actions");
const editMovieBtn = document.getElementById("edit-movie-btn");
const deleteMovieBtn = document.getElementById("delete-movie-btn");
const editMovieForm = document.getElementById("edit-movie-form");

const editTitle = document.getElementById("edit-title");
const editYear = document.getElementById("edit-year");
const editGenres = document.getElementById("edit-genres");
const editCast = document.getElementById("edit-cast");
const editDirector = document.getElementById("edit-director");
const editPoster = document.getElementById("edit-poster");
const editTrailer = document.getElementById("edit-trailer");
const editExtract = document.getElementById("edit-extract");

const addWatchlistBtn = document.getElementById("add-watchlist-btn");
const watchlistStatus = document.getElementById("watchlist-status");
const watchlistFavorite = document.getElementById("watchlist-favorite");

if (closeDetailsModal && detailsModal) {
  closeDetailsModal.addEventListener("click", () => {
    detailsModal.style.display = "none";
  });
}

if (detailsModal) {
  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) detailsModal.style.display = "none";
  });
}

function toEmbed(url) {
  if (!url) return "";
  const origin = encodeURIComponent(window.location.origin);
  if (url.includes("youtube.com/watch?v=")) {
    const id = new URL(url).searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}?origin=${origin}` : "";
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?origin=${origin}` : "";
  }
  return "";
}

let currentUser = null;
async function loadCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await fetch("http://localhost:5001/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  currentUser = await safeJson(res);
}
loadCurrentUser();

// admin panel
const adminPanel = document.getElementById("admin-panel");
const loadUsersBtn = document.getElementById("load-users-btn");
const adminUsersList = document.getElementById("admin-users-list");

function renderAdminUsers(users) {
  if (!adminUsersList) return;
  if (!users.length) {
    adminUsersList.innerHTML = "<p>No users found</p>";
    return;
  }

  adminUsersList.innerHTML = users.map((user) => {
    return `
      <div class="admin-user-card" data-id="${user._id}">
        <div class="admin-user-info">
          <strong>${user.username || "User"}</strong>
          <span>${user.email || ""}</span>
        </div>
        <div class="admin-user-actions">
          <select class="admin-role-select">
            <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
            <option value="premium" ${user.role === "premium" ? "selected" : ""}>Premium</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
          <button class="btn btn-primary admin-save-role">Save</button>
        </div>
      </div>
    `;
  }).join("");

  adminUsersList.querySelectorAll(".admin-save-role").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".admin-user-card");
      const userId = card?.dataset.id;
      const role = card?.querySelector(".admin-role-select")?.value;
      if (!userId || !role) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:5001/api/users/${userId}/role`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ role })
        });

        const data = await safeJson(res);
        if (!res.ok) {
          showToast(extractError(data) || "Failed to update role", false);
          return;
        }

        showToast("Role updated");
      } catch {
        showToast("Network error", false);
      }
    });
  });
}

async function loadUsersForAdmin() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5001/api/users/all", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await safeJson(res);
    if (!res.ok) {
      showToast(extractError(data) || "Failed to load users", false);
      return;
    }
    renderAdminUsers(data?.users || []);
  } catch {
    showToast("Network error", false);
  }
}

if (adminPanel) {
  const token = localStorage.getItem("token");
  if (token) {
    fetch("http://localhost:5001/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((user) => {
        if (user?.role === "admin") {
          adminPanel.style.display = "block";
        }
      });
  }
}

if (loadUsersBtn) {
  loadUsersBtn.addEventListener("click", loadUsersForAdmin);
}

// reviews
const reviewRating = document.getElementById("review-rating");
const reviewComment = document.getElementById("review-comment");
const submitReviewBtn = document.getElementById("submit-review");
const reviewsList = document.getElementById("reviews-list");

async function loadReviews(movieId) {
  const res = await fetch(`http://localhost:5001/api/movies/${movieId}/reviews`);
  const data = await safeJson(res);
  const reviews = data?.reviews || [];

  if (reviewsList) {
    reviewsList.innerHTML = reviews.map(r => {
      const canEdit = currentUser && r.userId === currentUser._id;
      const canDelete = currentUser && (r.userId === currentUser._id || currentUser.role === "admin");

      return `
        <div class="review-item" data-id="${r._id}">
          <strong>${r.username || "User"}</strong> - ⭐ ${r.rating}
          <p>${r.comment}</p>
          ${canEdit ? `<button class="edit-review-btn">Edit</button>` : ""}
          ${canDelete ? `<button class="delete-review-btn">Delete</button>` : ""}
        </div>
      `;
    }).join("");
  }

  reviewsList.querySelectorAll(".edit-review-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const reviewId = e.target.closest(".review-item").dataset.id;
      const newRating = prompt("New rating (1-5):");
      const newComment = prompt("New comment:");
      if (!newRating || !newComment) return;

      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/movies/${selectedMovie._id}/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });

      if (res.ok) loadReviews(selectedMovie._id);
    });
  });

  reviewsList.querySelectorAll(".delete-review-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const reviewId = e.target.closest(".review-item").dataset.id;
      const ok = confirm("Delete this review?");
      if (!ok) return;

      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/movies/${selectedMovie._id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) loadReviews(selectedMovie._id);
    });
  });
}

if (submitReviewBtn) {
  submitReviewBtn.addEventListener("click", async () => {
    if (!selectedMovie?._id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const rating = reviewRating?.value;
    const comment = reviewComment?.value.trim();
    if (!rating || !comment) {
      showToast("Rating and comment required", false);
      return;
    }

    const res = await fetch(`http://localhost:5001/api/movies/${selectedMovie._id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating, comment })
    });

    const data = await safeJson(res);
    if (!res.ok) {
      showToast(extractError(data) || "Failed to add review", false);
      return;
    }

    showToast("Review added");
    reviewComment.value = "";
    reviewRating.value = "";
    loadReviews(selectedMovie._id);
  });
}

function openDetailsModal(movie) {
  selectedMovie = movie;

  if (addWatchlistBtn) {
    addWatchlistBtn.textContent = "Add";
    addWatchlistBtn.classList.remove("added");
    addWatchlistBtn.disabled = false;
  }

  if (!detailsModal) return;
  detailsTitle.textContent = movie.title || "Untitled";
  detailsPoster.src = movie.posterUrl || "";
  detailsPoster.style.display = movie.posterUrl ? "block" : "none";
  detailsYear.textContent = movie.year ? `Year: ${movie.year}` : "";
  detailsGenres.textContent = movie.genres?.length ? `Genres: ${movie.genres.join(", ")}` : "";
  detailsCast.textContent = movie.cast?.length ? `Cast: ${movie.cast.join(", ")}` : "";
  detailsDirector.textContent = movie.director?.length ? `Director: ${movie.director.join(", ")}` : "";
  detailsExtract.textContent = movie.extract || "";

  const embedUrl = toEmbed(movie.trailerUrl);
  if (embedUrl) {
    trailerIframe.src = embedUrl;
    trailerWrap.style.display = "block";
  } else {
    trailerIframe.src = "";
    trailerWrap.style.display = "none";
  }

  detailsModal.style.display = "flex";
  loadReviews(movie._id);
  loadMovieStats(movie._id);

  const token = localStorage.getItem("token");
  if (token && detailsActions) {
    fetch("http://localhost:5001/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((user) => {
        detailsActions.style.display = user?.role === "admin" ? "flex" : "none";
      });
  }
}

// update movie
if (editMovieBtn && editMovieForm) {
  editMovieBtn.addEventListener("click", () => {
    if (!selectedMovie) return;
    editTitle.value = selectedMovie.title || "";
    editYear.value = selectedMovie.year || "";
    editGenres.value = (selectedMovie.genres || []).join(", ");
    editCast.value = (selectedMovie.cast || []).join(", ");
    editDirector.value = (selectedMovie.director || []).join(", ");
    editPoster.value = selectedMovie.posterUrl || "";
    editTrailer.value = selectedMovie.trailerUrl || "";
    editExtract.value = selectedMovie.extract || "";
    editMovieForm.style.display = "block";
  });
}

if (editMovieForm) {
  editMovieForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedMovie?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      title: editTitle.value.trim(),
      year: Number(editYear.value),
      genres: editGenres.value.split(",").map(g => g.trim()).filter(Boolean),
      cast: editCast.value.split(",").map(c => c.trim()).filter(Boolean),
      director: editDirector.value.split(",").map(d => d.trim()).filter(Boolean),
      posterUrl: editPoster.value.trim(),
      trailerUrl: editTrailer.value.trim(),
      extract: editExtract.value.trim()
    };

    const res = await fetch(`http://localhost:5001/api/movies/${selectedMovie._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    const data = await safeJson(res);
    if (!res.ok) {
      showToast(extractError(data) || "Update failed", false);
      return;
    }

    showToast("Movie updated");
    setTimeout(() => window.location.reload(), 800);
  });
}

// delete movie
if (deleteMovieBtn) {
  deleteMovieBtn.addEventListener("click", async () => {
    if (!selectedMovie?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const ok = confirm("Delete this movie?");
    if (!ok) return;

    const res = await fetch(`http://localhost:5001/api/movies/${selectedMovie._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showToast("Movie deleted");
      setTimeout(() => window.location.reload(), 800);
    } else {
      const data = await safeJson(res);
      showToast(extractError(data) || "Delete failed", false);
    }
  });
}

// update delete watchlist
if (addWatchlistBtn) {
  addWatchlistBtn.addEventListener("click", async () => {
    if (!selectedMovie?._id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const status = watchlistStatus?.value || "plan_to_watch";
    const isFavorite = !!watchlistFavorite?.checked;

    try {
      const res = await fetch("http://localhost:5001/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ movieId: selectedMovie._id, status, isFavorite })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        showToast(extractError(data) || "Failed to update watchlist", false);
        return;
      }

      showToast("Watchlist updated");
      addWatchlistBtn.textContent = "Saved";
      addWatchlistBtn.classList.add("added");
      addWatchlistBtn.disabled = true;
    } catch {
      showToast("Network error", false);
    }
  });
}

// watchlist fetch
const watchlistPlan = document.getElementById("watchlist-plan");
const watchlistCompleted = document.getElementById("watchlist-completed");
const watchlistDropped = document.getElementById("watchlist-dropped");
const emptyWatchlist = document.getElementById("empty-watchlist");

function renderWatchlistCard(entry) {
  const movie = entry.movie || {};
  const title = movie.title || "Untitled";
  const poster = movie.posterUrl
    ? `style="background-image:url('${movie.posterUrl}')"`
    : "";
  const placeholder = title[0] || "M";

  return `
    <div class="movie-card">
      <div class="movie-card-poster" ${poster}>
        ${movie.posterUrl ? "" : `<span class="movie-card-placeholder-text">${placeholder}</span>`}
      </div>
      <div class="movie-card-overlay">
        <div class="movie-card-header">
          <h3>${title}</h3>
        </div>
      </div>
    </div>
  `;
}

function attachWatchlistClicks(container, entries) {
  if (!container) return;
  container.querySelectorAll(".movie-card").forEach((card, i) => {
    card.addEventListener("click", () => openDetailsModal(entries[i].movie));
  });
}

if (watchlistPlan || watchlistCompleted || watchlistDropped || watchlistFavorite) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  } else {
    fetch("http://localhost:5001/api/watchlist", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const list = data.watchlist || [];

        if (list.length === 0) {
          if (emptyWatchlist) emptyWatchlist.style.display = "block";
          return;
        }
        if (emptyWatchlist) emptyWatchlist.style.display = "none";

        const plan = list.filter((e) => e.status === "plan_to_watch");
        const completed = list.filter((e) => e.status === "completed");
        const dropped = list.filter((e) => e.status === "dropped");
        const favorite = list.filter((e) => e.isFavorite === true);

        if (watchlistPlan) {
          watchlistPlan.innerHTML = plan.map(renderWatchlistCard).join("");
          attachWatchlistClicks(watchlistPlan, plan);
        }
        if (watchlistCompleted) {
          watchlistCompleted.innerHTML = completed.map(renderWatchlistCard).join("");
          attachWatchlistClicks(watchlistCompleted, completed);
        }
        if (watchlistDropped) {
          watchlistDropped.innerHTML = dropped.map(renderWatchlistCard).join("");
          attachWatchlistClicks(watchlistDropped, dropped);
        }
        if (watchlistFavorite) {
          watchlistFavorite.innerHTML = favorite.map(renderWatchlistCard).join("");
          attachWatchlistClicks(watchlistFavorite, favorite);
        }
      })
      .catch(() => {
        if (emptyWatchlist) {
          emptyWatchlist.textContent = "Failed to load watchlist.";
          emptyWatchlist.style.display = "block";
        }
      });
  }
}

// premium watchlist panel
const premiumPanel = document.getElementById("premium-panel");
const premiumStats = document.getElementById("premium-stats");

async function loadPremiumStats() {
  const token = localStorage.getItem("token");
  if (!token || !premiumStats) return;
  try {
    const res = await fetch("http://localhost:5001/api/watchlist/stats", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await safeJson(res);
    if (!res.ok) return;

    const stats = data?.stats || [];
    premiumStats.innerHTML = stats.map((s) => {
      return `<div class="premium-stat"><strong>${s.count}</strong><span>${s.status}</span></div>`;
    }).join("");
  } catch {
    // ignore
  }
}

if (premiumPanel) {
  const token = localStorage.getItem("token");
  if (token) {
    fetch("http://localhost:5001/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((user) => {
        if (user?.role === "premium" || user?.role === "admin") {
          premiumPanel.style.display = "block";
          loadPremiumStats();
        }
      });
  }
}


// remove movie from list
const removeWatchlistBtn = document.getElementById("remove-watchlist-btn");
if (removeWatchlistBtn) {
  removeWatchlistBtn.addEventListener("click", async () => {
    if (!selectedMovie?._id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    try {
      const listRes = await fetch("http://localhost:5001/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await safeJson(listRes);
      const entry = (listData?.watchlist || []).find(
        (e) => e.movie?._id === selectedMovie._id
      );
      if (!entry) {
        showToast("Not in watchlist", false);
        return;
      }

      const res = await fetch(`http://localhost:5001/api/watchlist/${entry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Removed from watchlist");
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await safeJson(res);
        showToast(extractError(data) || "Remove failed", false);
      }
    } catch {
      showToast("Network error", false);
    }
  });
}
  })();
}
