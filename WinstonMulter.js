const express = require('express');
const http = require('http');
const nodemailer = require('nodemailer'); // Include nodemailer
const moment = require('moment');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const winston = require('winston');
const multer = require('multer');
const cron = require("node-cron");
const i18n = require('i18n');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads')); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Set the filename for uploaded files
  },
});
const upload = multer({ storage: storage });

//translations for languages
i18n.configure({
  locales: ['en', 'fr'], // List of supported locales
  defaultLocale: 'en',  // Default locale
  directory: path.join(__dirname, 'locales'), // Directory containing translation JSON files
  objectNotation: true, // Enable nested JSON structure for translations
});


app.use(express.static(path.join(__dirname,'./public')));
//logging with winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
logger.info({ timestamp: currentTime });

var name;

io.on('connection', (socket) => {
  logger.info('new user connected');
  
  socket.on('joining msg', (username) => {
    name = username;
    io.emit('chat message', `---${name} joined the chat at ${moment().format('YYYY-MM-DD HH:mm:ss')}---`);


  });
  
  socket.on('disconnect', () => {
    logger.info('user disconnected');
    io.emit('chat message', `---${name} left the chat at ${moment().format('YYYY-MM-DD HH:mm:ss')}---`);


  });
  
  socket.on('chat message', (msg) => {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    io.emit('chat message', `[${timestamp}] ${name}: ${msg}`);
  });
});
// Schedule a cron job to send a periodic message to the chat
cron.schedule('0 * * * *', () => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  io.emit('chat message', `[CRON Job] This is an automated message sent at ${timestamp}`);
});
server.listen(3000, () => {
  logger.info('Server listening on :3000');
});
