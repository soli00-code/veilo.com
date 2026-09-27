// Express 4 doesn't automatically catch rejected promises from async route
// handlers — without this, a thrown error (e.g. an invalid ObjectId in a URL,
// which Mongoose rejects rather than throws synchronously) would leave the
// request hanging with no response instead of returning a clean error.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
