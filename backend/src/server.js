const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const HttpException = require("./utils/HttpException.utils");
const errorMiddleware = require("./middleware/error.middleware");
const userRouter = require("./routes/api/user.route");
const walletRouter = require("./routes/api/wallet.route");
const subscriberRouter = require("./routes/api/subscriber.route");
const ieoRouter = require("./routes/api/ieo.route");
const p2pRouter = require("./routes/api/p2p.route");
const WalletService = require("./services/wallet.service");
cron.schedule("*/10 * * * *", () => {
  WalletService.updateTopTokens().then(() => {
    console.log("Top Token data updated");
  });
});

// Init express
const app = express();
// Init environment
dotenv.config();
// parse requests of content-type: application/json
// parses incoming requests with JSON payloads
app.use(express.json());
app.use(cookieParser());
// enabling cors for all requests by using cors middleware
app.use(cors());
// Enable pre-flight
app.options("*", cors());
app.use(
  session({
    key: generateSessionID(),
    secret: process.env.SESSION_SUPER_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: Number(process.env.SESSION_EXPIRATION || 86400000),
    },
  })
);

const port = Number(process.env.PORT || 3000);
app.use(cookieParser());

app.use(`/api/users`, userRouter);
app.use(`/api/wallets`, walletRouter);
app.use(`/api/subscribers`, subscriberRouter);
app.use(`/api/ieo`, ieoRouter);
app.use(`/api/p2p`, p2pRouter);

// 404 error
app.all("*", (req, res, next) => {
  const err = new HttpException(404, "Endpoint Not Found");
  next(err);
});

const generateSessionID = () => {
  // Generate a unique user session ID
  const timestamp = new Date().getTime(); // Get current timestamp
  const randomNum = Math.floor(Math.random() * 1000000); // Generate a random number

  // Combine timestamp and random number to create a unique ID
  const sessionID = `${timestamp}-${randomNum}`;

  return sessionID;
};

// Error middleware
app.use(errorMiddleware);

// starting the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}!`);
});

module.exports = app;
