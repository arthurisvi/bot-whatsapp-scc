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

const API_URL = "https://api.cartolafc.globo.com/";

client.on("message", (message) => {
    // pegar a pontuação de um jogador específico
    if (message.body.includes(".pontuacao ")) {
        let arrayPesquisa = message.body.split(" ");
        let jogador = arrayPesquisa[1];

        axios.get(API_URL + "atletas/pontuados").then((res) => {
            let jogadores = res.data.atletas;

            Object.keys(jogadores).forEach((item) => {
                if (
                    jogadores[item].apelido.normalize("NFD").toLowerCase() ===
                    jogador.normalize("NFD").toLowerCase()
                ) {
                    message.reply(
                        `A pontuação do jogador ${jogadores[item].apelido} é: ${jogadores[item].pontuacao}`
                    );
                }
            });
        });
    }
    // trazer a pontuação de um time especifico
    else if (message.body.includes(".time")) {
        let time = message.body.replace(".time", "").replace(/^./, "");
        let slug = time.replace(/ /g, "-").toLowerCase();

        axios.get(API_URL + "times?q=" + slug).then((res) => {
            let timeCartola = res.data;
            var id_time = null;
            var filtroJogadores = [];
            var todosJogadores = [];

            if (timeCartola) {
                Object.keys(timeCartola).forEach((item) => {
                    id_time = timeCartola[item].time_id;
                    nome_time = timeCartola[item].nome;
                });
            } else {
                message.reply("Desculpe, não consegui localizar esse time :(");
            }

            axios.get(API_URL + "mercado/status").then((res) => {
                let rodada = res.data.rodada_atual;

                if (id_time !== null) {
                    axios.get(`${API_URL}time/id/${id_time}/${rodada}`).then((res) => {
                        var escalacao = res.data.atletas;
                        var capitao = res.data.capitao_id;

                        axios.get(API_URL + "atletas/pontuados").then((res) => {
                            var jogadoresPontuacao = res.data.atletas;

                            Object.keys(jogadoresPontuacao).forEach((jogador) => {
                                todosJogadores.push(jogadoresPontuacao[jogador]);
                                for (jogadorEscalado in escalacao) {
                                    if (
                                        escalacao[jogadorEscalado].clube_id ===
                                        jogadoresPontuacao[jogador].clube_id &&
                                        escalacao[jogadorEscalado].apelido ===
                                        jogadoresPontuacao[jogador].apelido
                                    ) {
                                        if (escalacao[jogadorEscalado].atleta_id === capitao) {
                                            jogadoresPontuacao[jogador].pontuacao =
                                                jogadoresPontuacao[jogador].pontuacao * 2;
                                        }
                                        filtroJogadores.push(jogadoresPontuacao[jogador]);
                                    }
                                }
                            });

                            let somaPontuacao = 0;
                            for (pontuacao in filtroJogadores) {
                                somaPontuacao += filtroJogadores[pontuacao].pontuacao;
                            }

                            message.reply(
                                `A pontuação de ${nome_time} é: ${somaPontuacao} pontos`
                            );
                        });
                    });
                }
            });
        });
    }
});