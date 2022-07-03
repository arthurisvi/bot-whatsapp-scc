const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const axios = require("axios");

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

const API_URL = "https://api.cartolafc.globo.com/"

client.on("message", (message) => {
    if (message.body.includes(".pontuacao ")) {
        let arrayPesquisa = message.body.split(" ");
        let jogador = arrayPesquisa[1];

        axios
            .get(API_URL + "atletas/pontuados")
            .then((res) => {
                let jogadores = res.data.atletas;

                Object.keys(jogadores).forEach((item) => {
                    if (jogadores[item].apelido.normalize("NFD").toLowerCase() === jogador.normalize("NFD").toLowerCase()) {
                        message.reply(
                            `A pontuação do jogador ${jogadores[item].apelido} é: ${jogadores[item].pontuacao}`
                        );
                    }
                });
            });
    } else if (message.body.includes(".time")) {
        let time = message.body.replace(".time", "").replace(/^./, "");
        let slug = time.replace(/ /g, "-").toLowerCase();

        axios.get(API_URL + "times?q=" + slug).then((res) => {
            let timeCartola = res.data;

            if (timeCartola) {
                Object.keys(timeCartola).forEach((item) => {
                    message.reply(`
                        Cartoleiro: ${timeCartola[item].nome_cartola}\n
                        Id do time: ${timeCartola[item].time_id}
                    `);
                });
            } else {
                message.reply("Desculpe, não consegui localizar esse time :(");
            }

        });

    }
});