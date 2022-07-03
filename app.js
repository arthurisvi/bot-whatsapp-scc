const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("message", (message) => {
    if (message.body === "hello") {
        message.reply("Hiiiii");
    }
});