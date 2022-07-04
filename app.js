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

    if (message.body === "!menu") {
        message.reply(
            "🤖 *RoboSCCop* - O seu bot do cartola! 🎩\n\n_Olá, eu sou um robô criado para te manter informado sobre parciais e outras questões do Cartola FC via Whatsapp._\n\n📲 *Meu menu*\n!pontuacao _[nome do jogador]_\n!parcial _[nome do time]_\n!mais-escalados\n\n🎩 *Sobre o SCC*\nO SCC é uma organização responsável por gerenciar campeonatos premiados de Cartola FC.\n\nConfira 👇🏻\nhttps://sccartola.com/competicoes/sccvip.php\n\n👨🏻‍💻 *Contato do desenvolvedor*\nwa.me/5581996420780 (Arthur Isvi)"
        );
    }

    // pegar a pontuação de um jogador específico
    if (message.body.includes("!pontuacao ")) {
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
                        `A pontuação parcial do jogador ${jogadores[item].apelido} é: ${jogadores[item].pontuacao}`
                    );
                }
            });
        });
    }
    // trazer a pontuação de um time especifico
    else if (message.body.includes("!parcial")) {
        let time = message.body.replace("!parcial", "").replace(/^./, "");
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
                                `A pontuação parcial de ${nome_time} é: ${somaPontuacao.toFixed(2)} pontos`
                            );
                        });
                    });
                }
            });
        });
    }
    //pesquisar os mais escalados
    else if (message.body === "!mais-escalados") {
        axios.get(API_URL + "mercado/destaques").then((res) => {
            var arrayMaisEscalados = [];

            let maisEscalados = res.data;
            Object.keys(maisEscalados).forEach((destaque) => {
                arrayMaisEscalados.push(maisEscalados[destaque].Atleta.apelido);
            })

            let mensagem = arrayMaisEscalados.toString().replace(/,/g, "\n");
            message.reply(`Os mais escalados da rodada são:\n\n${mensagem}`);
        })
    }
});