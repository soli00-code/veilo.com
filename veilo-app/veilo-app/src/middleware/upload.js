const multer = require('multer');

// Voice notes go straight into memory and then into MongoDB as a Buffer —
// see Message.js for why. 8MB comfortably covers a couple of minutes of
// compressed audio from the browser's MediaRecorder.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

module.exports = upload;
