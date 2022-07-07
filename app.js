const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
const env = require("./config/config");

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

client.on("message", async(message) => {
    if (message.body === "!menu") {
        message.reply(
            "🤖 *SCCoty* - Inteligência Artificial do Cartola! 🎩\n\n_Olá, eu sou a Sccoty, uma IA criada para te manter informado sobre parciais e outras informações relacionadas ao Cartola FC._\n\n📲 *Lista de comandos*\n!pontuacao _[nome do jogador]_\n!parcial _[nome do time]_\n!info _[nome do time]_\n!mais-escalados\n\n🎩 *Sobre o SCC*\nO SCC é uma organização responsável por gerenciar campeonatos premiados de Cartola FC.\n\nConfira 👇🏻\nhttps://sccartola.com/competicoes/sccvip.php\n\n👨🏻‍💻 *Contato do desenvolvedor*\nwa.me/5581996420780 (Arthur Isvi)"
        );
    }

    axios
        .get(env.API_URL + "mercado/status")
        .then((res) => {
            const statusMercado = res.data.status_mercado;
            const rodadaAtual = res.data.rodada_atual;
            if (
                message.body.includes("!pontuacao ") ||
                message.body.includes("!parcial ")
            ) {
                if (statusMercado !== 1) {
                    // pegar a pontuação de um jogador específico
                    if (message.body.includes("!pontuacao ")) {
                        let arrayPesquisa = message.body.split(" ");
                        let jogador = "";
                        if (arrayPesquisa.length === 2) {
                            jogador = arrayPesquisa[1];
                        } else if (arrayPesquisa.length === 3) {
                            jogador = `${arrayPesquisa[1]} ${arrayPesquisa[2]}`;
                        }

                        axios
                            .get(env.API_URL + "atletas/pontuados")
                            .then((res) => {
                                let jogadores = res.data.atletas;

                                Object.keys(jogadores).forEach((item) => {
                                    if (
                                        jogadores[item].apelido.normalize("NFD").toLowerCase() ===
                                        jogador.normalize("NFD").toLowerCase()
                                    ) {
                                        message.reply(
                                            `A pontuação parcial do jogador ${jogadores[item].apelido} é: ${jogadores[item].pontuacao}`
                                        );
                                    } else {
                                        throw new Error(
                                            "⚠️🤖❓\nOps, jogador não encontrado. Verifique a grafia e se o jogador está em campo ou já atuou na rodada."
                                        );
                                    }
                                });
                            })
                            .catch((err) => {
                                message.reply(
                                    "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                );
                            });
                    }
                    // trazer a pontuação de um time especifico
                    else if (message.body.includes("!parcial")) {
                        let time = message.body.replace("!parcial", "").replace(/^./, "");
                        let slug = time.replace(/ /g, "-").toLowerCase();

                        axios.get(env.API_URL + "times?q=" + slug).then((res) => {
                            let timeCartola = res.data;
                            var id_time = null;
                            var filtroJogadores = [];
                            var todosJogadores = [];
                            var nomesJogadores = [];
                            var nomesJogadoresEscalacao = [];

                            if (timeCartola) {
                                Object.keys(timeCartola).forEach((item) => {
                                    id_time = timeCartola[item].time_id;
                                    nome_time = timeCartola[item].nome;
                                });
                            } else {
                                message.reply(
                                    "⚠️🤖❓ Desculpe, não consegui localizar esse time :( Verifique a grafia e tente novamente."
                                );
                            }

                            if (id_time !== null) {
                                axios
                                    .get(`${env.API_URL}time/id/${id_time}/${rodadaAtual}`)
                                    .then((res) => {
                                        var escalacao = res.data.atletas;
                                        var reservas = res.data.reservas;
                                        var capitao = res.data.capitao_id;

                                        for (nomeJogador in escalacao) {
                                            const jogador = {
                                                posicao_id: escalacao[nomeJogador].posicao_id,
                                                apelido: escalacao[nomeJogador].apelido,
                                                clube_id: escalacao[nomeJogador].clube_id,
                                            };
                                            nomesJogadoresEscalacao.push(jogador);
                                        }

                                        axios
                                            .get(env.API_URL + "atletas/pontuados")
                                            .then((res) => {
                                                var jogadoresPontuacao = res.data.atletas;

                                                Object.keys(jogadoresPontuacao).forEach((jogador) => {
                                                    todosJogadores.push(jogadoresPontuacao[jogador]);

                                                    for (jogadorEscalado in escalacao) {
                                                        if (
                                                            escalacao[jogadorEscalado].clube_id ===
                                                            jogadoresPontuacao[jogador].clube_id &&
                                                            escalacao[jogadorEscalado].apelido ===
                                                            jogadoresPontuacao[jogador].apelido &&
                                                            escalacao[jogadorEscalado].posicao_id ===
                                                            jogadoresPontuacao[jogador].posicao_id
                                                        ) {
                                                            if (
                                                                escalacao[jogadorEscalado].atleta_id ===
                                                                capitao
                                                            ) {
                                                                jogadoresPontuacao[jogador].pontuacao =
                                                                    jogadoresPontuacao[jogador].pontuacao * 2;
                                                            }
                                                            filtroJogadores.push(
                                                                jogadoresPontuacao[jogador]
                                                            );

                                                            const futebolista = {
                                                                posicao_id: escalacao[jogadorEscalado].posicao_id,
                                                                apelido: escalacao[jogadorEscalado].apelido,
                                                                clube_id: escalacao[jogadorEscalado].clube_id,
                                                            };
                                                            nomesJogadores.push(futebolista);
                                                        }
                                                    }
                                                });

                                                let apenasEmA = nomesJogadoresEscalacao.filter(
                                                    comparer(nomesJogadores)
                                                );
                                                let apenasEmB = nomesJogadores.filter(
                                                    comparer(nomesJogadoresEscalacao)
                                                );

                                                let titularesNaoJogaram = apenasEmA.concat(apenasEmB);

                                                let posicoesSubstituicao = [];
                                                for (naoJogou in titularesNaoJogaram) {
                                                    posicoesSubstituicao.push(
                                                        titularesNaoJogaram[naoJogou].posicao_id
                                                    );
                                                }

                                                //reservas.filter(reserva => posicoesSubstituicao.includes(reserva.posicao_id)

                                                let somaPontuacao = 0;
                                                for (pontuacao in filtroJogadores) {
                                                    somaPontuacao +=
                                                        filtroJogadores[pontuacao].pontuacao;
                                                }
                                                message.reply(
                                                    `A pontuação parcial de ${nome_time} é: ${somaPontuacao.toFixed(
                              2
                            )} pontos`
                                                );
                                            })
                                            .catch((err) => {
                                                message.reply(
                                                    "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                                );
                                            });
                                    })
                                    .catch((err) => {
                                        message.reply(
                                            "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                        );
                                    });
                            }
                        });
                    }
                } else {
                    message.reply(
                        "❌🤖🚫\nDesculpe, essa solicitação só pode ser feita com a rodada em andamento!"
                    );
                }
            }
        })
        .catch((err) => {
            message.reply(
                "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
            );
        });
    //pesquisar os mais escalados

    if (message.body === "!mais-escalados") {
        axios
            .get(env.API_URL + "mercado/destaques")
            .then((res) => {
                var arrayMaisEscalados = [];

                let maisEscalados = res.data;
                Object.keys(maisEscalados).forEach((destaque) => {
                    arrayMaisEscalados.push(maisEscalados[destaque].Atleta.apelido);
                });

                let mensagem = arrayMaisEscalados.toString().replace(/,/g, "\n");
                message.reply(
                    `👕 Os *mais escalados* da rodada são:\n\n${mensagem}`
                );
            })
            .catch((err) => {
                message.reply(
                    "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                );
            });
    }

    //trazer algumas informações de um time
    if (message.body.includes("!info")) {
        let time = message.body.replace("!info", "").replace(/^./, "");
        let slug = time.replace(/ /g, "-").toLowerCase();


        axios.get(env.API_URL + "mercado/status").then((res) => {

            let rodadaAtual = res.data.rodada_atual;

            axios
                .get(env.API_URL + "times?q=" + slug)
                .then(async(res) => {
                    let timeCartola = res.data;
                    let time_id = timeCartola[0].time_id;

                    axios
                        .get(env.API_URL + "time/id/" + time_id)
                        .then(async(res) => {
                            let pontuacaoGeral = res.data.pontos_campeonato;
                            let patrimonio = res.data.patrimonio;
                            let nomeCartoleiro = res.data.time.nome_cartola;
                            let nomeTime = res.data.time.nome;
                            let anoInicio = res.data.time.temporada_inicial;
                            let mediaPontuacao = pontuacaoGeral / (rodadaAtual - 1);

                            const options = {
                                unsafeMime: true,
                            };
                            const escudo = await MessageMedia.fromUrl(
                                res.data.time.url_escudo_png,
                                options
                            );

                            client.sendMessage(message.from, escudo, {
                                caption: `🛡️ *${nomeTime}* \n🎩 Cartoleiro: ${nomeCartoleiro}\n📈 Pontuação geral: ${pontuacaoGeral.toFixed(
                        2
                      )}\n💰 Patrimônio: ${patrimonio}\n📊 Média na temporada: ${mediaPontuacao.toFixed(
                        2
                      )}\n_Cartoleiro desde ${anoInicio}_`,
                            });
                        })
                        .catch((err) => {
                            message.reply(
                                "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                            );
                        });
                })
                .catch((err) => {
                    message.reply(
                        "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                    );
                });

        }).catch((err) => {
            message.reply(
                "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
            );
        })
    }
});

function comparer(otherArray) {
    return function(current) {
        return (
            otherArray.filter((other) => {
                return (
                    other.posicao_id == current.posicao_id &&
                    other.apelido == current.apelido &&
                    other.clube_id == current.clube_id
                );
            }).length == 0
        );
    };
}