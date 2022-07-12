const dotenv = require("dotenv");

dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

module.exports = {
    API_URL: process.env.API_URL,
    ID_GROUP_SCC1: process.env.ID_GROUP_SCC1,
    ID_GROUP_SCC2: process.env.ID_GROUP_SCC2,
    ID_GROUP_TEST: process.env.ID_GROUP_TEST
}