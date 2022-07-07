const dotenv = require("dotenv");

dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

module.exports = {
    API_URL: process.env.API_URL,
}