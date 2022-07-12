const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
const env = require("./config/config");
const https = require("https");

axios.defaults.timeout = 60000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

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
    if (
        message.from === env.ID_GROUP_SCC1 ||
        message.from === env.ID_GROUP_SCC2
    ) {
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

                            jogador = jogador
                                .normalize("NFD")
                                .toLowerCase()
                                .replace(/[\u0300-\u036f]/g, "");

                            axios
                                .get(env.API_URL + "atletas/pontuados")
                                .then((res) => {
                                    let jogadores = res.data.atletas;

                                    Object.keys(jogadores).forEach((item) => {
                                        if (
                                            jogadores[item].apelido
                                            .normalize("NFD")
                                            .toLowerCase()
                                            .replace(/[\u0300-\u036f]/g, "") === jogador
                                        ) {
                                            let scoutsJogador = JSON.stringify(
                                                    jogadores[item].scout
                                                )
                                                .replace(/,/g, "\n")
                                                .replace(/"/g, "")
                                                .replace(/{/g, "")
                                                .replace(/}/g, "")
                                                .replace(/:/g, " - ");

                                            message.reply(
                                                `A pontuação parcial de ${jogadores[item].apelido} é: ${jogadores[item].pontuacao}\n\n_Scouts:_\n${scoutsJogador}\n\n_🤖 Parciais fornecidas por SCCoty (wa.me/19282855516)_`
                                            );
                                        }
                                    });
                                })
                                .catch((err) => {
                                    console.log(err);
                                    // message.reply(
                                    //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                    // );
                                });
                        }
                        // trazer a pontuação de um time especifico
                        else if (message.body.includes("!parcial")) {
                            let time = message.body
                                .replace("!parcial", "")
                                .replace(/^./, "")
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "");
                            let slug = time.replace(/ /g, "-").toLowerCase();

                            axios.get(env.API_URL + "times?q=" + slug).then((res) => {
                                let timeCartola = res.data;
                                var id_time = null;
                                var filtroJogadores = [];
                                var filtroReservas = [];

                                var todosJogadores = [];
                                var nomesJogadores = [];
                                var nomesJogadoresEscalacao = [];
                                var jogadoresReservas = [];
                                var reservasJogadores = [];

                                var achouTime = false;

                                if (timeCartola) {
                                    Object.keys(timeCartola).forEach((item) => {
                                        if (
                                            timeCartola[item].slug === slug.replace(/\.|\_/g, "-")
                                        ) {
                                            nome_time = timeCartola[item].nome;
                                            id_time = timeCartola[item].time_id;
                                            achouTime = true;
                                        } else if (
                                            timeCartola[item].nome.toLowerCase() ===
                                            time.toLowerCase()
                                        ) {
                                            nome_time = timeCartola[item].nome;
                                            id_time = timeCartola[item].time_id;
                                            achouTime = true;
                                        }
                                    });
                                } else {
                                    message.reply(
                                        "⚠️🤖❓ Desculpe, não consegui localizar esse time :( Verifique a grafia e tente novamente."
                                    );
                                }

                                if (!achouTime) {
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

                                            for (banco in reservas) {
                                                const jogadorRes = {
                                                    posicao_id: reservas[banco].posicao_id,
                                                    apelido: reservas[banco].apelido,
                                                    clube_id: reservas[banco].clube_id,
                                                };

                                                jogadoresReservas.push(jogadorRes);
                                            }

                                            axios
                                                .get(env.API_URL + "atletas/pontuados")
                                                .then((res) => {
                                                    var jogadoresPontuacao = res.data.atletas;
                                                    var idCptPosicao = null;
                                                    var capitaoSaiu = false;

                                                    Object.keys(jogadoresPontuacao).forEach(
                                                        (jogador) => {
                                                            todosJogadores.push(
                                                                jogadoresPontuacao[jogador]
                                                            );

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
                                                                            jogadoresPontuacao[jogador].pontuacao *
                                                                            2;

                                                                        idCptPosicao =
                                                                            jogadoresPontuacao[jogador].posicao_id;

                                                                        jogadoresPontuacao[jogador] = {
                                                                            pontuacao: jogadoresPontuacao[jogador].pontuacao,
                                                                            apelido: jogadoresPontuacao[jogador].apelido,
                                                                            clube_id: jogadoresPontuacao[jogador].clube_id,
                                                                            posicao_id: jogadoresPontuacao[jogador]
                                                                                .posicao_id,
                                                                            entrou_em_campo: true,
                                                                            isCapitain: true,
                                                                        };
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

                                                            for (reservaEscalado in reservas) {
                                                                if (
                                                                    reservas[reservaEscalado].clube_id ===
                                                                    jogadoresPontuacao[jogador].clube_id &&
                                                                    reservas[reservaEscalado].apelido ===
                                                                    jogadoresPontuacao[jogador].apelido &&
                                                                    reservas[reservaEscalado].posicao_id ===
                                                                    jogadoresPontuacao[jogador].posicao_id
                                                                ) {
                                                                    filtroReservas.push(
                                                                        jogadoresPontuacao[jogador]
                                                                    );

                                                                    const futebolistaRes = {
                                                                        posicao_id: reservas[reservaEscalado].posicao_id,
                                                                        apelido: reservas[reservaEscalado].apelido,
                                                                        clube_id: reservas[reservaEscalado].clube_id,
                                                                    };
                                                                    reservasJogadores.push(futebolistaRes);
                                                                }
                                                            }
                                                        }
                                                    );

                                                    let apenasEmA = nomesJogadoresEscalacao.filter(
                                                        comparer(nomesJogadores)
                                                    );

                                                    let apenasEmB = nomesJogadores.filter(
                                                        comparer(nomesJogadoresEscalacao)
                                                    );

                                                    let apenasEmC = reservasJogadores.filter(
                                                        comparer(jogadoresReservas)
                                                    );

                                                    let apenasEmD = jogadoresReservas.filter(
                                                        comparer(reservasJogadores)
                                                    );

                                                    let titularesNaoJogaram =
                                                        apenasEmA.concat(apenasEmB);
                                                    let reservasNaoEntraram =
                                                        apenasEmC.concat(apenasEmD);

                                                    let posicoesSubstituicao = [];
                                                    for (naoJogou in titularesNaoJogaram) {
                                                        posicoesSubstituicao.push(
                                                            titularesNaoJogaram[naoJogou].posicao_id
                                                        );
                                                    }

                                                    titularesNaoJogaram = titularesNaoJogaram.map(
                                                        (item) => {
                                                            return {
                                                                posicao_id: item.posicao_id,
                                                                apelido: item.apelido,
                                                                pontuacao: 0.0,
                                                            };
                                                        }
                                                    );

                                                    reservasNaoEntraram = reservasNaoEntraram.map(
                                                        (item) => {
                                                            return {
                                                                posicao_id: item.posicao_id,
                                                                apelido: item.apelido,
                                                                pontuacao: 0.0,
                                                            };
                                                        }
                                                    );

                                                    for (titular in titularesNaoJogaram) {
                                                        filtroJogadores.push(
                                                            titularesNaoJogaram[titular]
                                                        );
                                                    }

                                                    for (reserva in reservasNaoEntraram) {
                                                        filtroReservas.push(reservasNaoEntraram[reserva]);
                                                    }

                                                    filtroReservas = filtroReservas.sort((a, b) => {
                                                        return a.posicao_id < b.posicao_id ?
                                                            -1 :
                                                            a.posicao_id > b.posicao_id ?
                                                            1 :
                                                            0;
                                                    });

                                                    filtroJogadores = filtroJogadores.sort((a, b) => {
                                                        return a.posicao_id < b.posicao_id ?
                                                            -1 :
                                                            a.posicao_id > b.posicao_id ?
                                                            1 :
                                                            0;
                                                    });

                                                    var arrayTitularSaiu = [];
                                                    var arrayReservaEntrou = [];

                                                    axios
                                                        .get(
                                                            env.API_URL + "time/substituicoes/" + id_time
                                                        )
                                                        .then((res) => {
                                                            for (jogador in res.data) {
                                                                if (
                                                                    res.data[jogador].saiu.posicao_id ===
                                                                    idCptPosicao
                                                                ) {
                                                                    capitaoSaiu = true;
                                                                }
                                                                arrayTitularSaiu.push({
                                                                    jogador: res.data[jogador].saiu.apelido,
                                                                });
                                                                arrayReservaEntrou.push({
                                                                    jogador: res.data[jogador].entrou.apelido,
                                                                });
                                                            }

                                                            filtroJogadores = filtroJogadores.map(
                                                                (item) => {
                                                                    return {
                                                                        jogador: item.apelido,
                                                                        pontuacao: item.pontuacao,
                                                                        isCapitain: item.isCapitain ? " ©️" : "",
                                                                    };
                                                                }
                                                            );

                                                            filtroReservas = filtroReservas.map((item) => {
                                                                return {
                                                                    jogador: item.apelido,
                                                                    pontuacao: item.pontuacao,
                                                                    posicao_id: item.posicao_id,
                                                                };
                                                            });

                                                            let somaPontuacaoBanco = 0;
                                                            for (reserva in filtroReservas) {
                                                                if (
                                                                    filtroReservas[reserva].posicao_id ===
                                                                    idCptPosicao &&
                                                                    capitaoSaiu
                                                                ) {
                                                                    filtroReservas[reserva].pontuacao =
                                                                        filtroReservas[reserva].pontuacao * 2;
                                                                }
                                                                for (res in arrayReservaEntrou) {
                                                                    if (
                                                                        arrayReservaEntrou[res].jogador ===
                                                                        filtroReservas[reserva].jogador
                                                                    ) {
                                                                        somaPontuacaoBanco +=
                                                                            filtroReservas[reserva].pontuacao;
                                                                    }
                                                                }
                                                            }

                                                            let somaPontuacao = 0;

                                                            for (pontuacao in filtroJogadores) {
                                                                somaPontuacao +=
                                                                    filtroJogadores[pontuacao].pontuacao;
                                                            }

                                                            somaPontuacao += somaPontuacaoBanco;

                                                            filtroJogadores = filtroJogadores.map(
                                                                (item) => {
                                                                    return {
                                                                        jogador: item.jogador +
                                                                            " | " +
                                                                            item.pontuacao +
                                                                            item.isCapitain,
                                                                    };
                                                                }
                                                            );

                                                            filtroReservas = filtroReservas.map((item) => {
                                                                return {
                                                                    jogador: item.jogador + " | " + item.pontuacao,
                                                                };
                                                            });

                                                            message.reply(
                                                                `Time: *${nome_time}*\nParcial: *${somaPontuacao.toFixed(
                                    2
                                  )}*\n\nTitulares:\n` +
                                                                JSON.stringify(filtroJogadores)
                                                                .replace(/,/g, "\n")
                                                                .replace(/"/g, "")
                                                                .replace(/jogador/g, "")
                                                                .replace(/{/g, "")
                                                                .replace(/}/g, "")
                                                                .replace(/:/g, "")
                                                                .replace(
                                                                    /[\[\]!'@,><://\\;&*()_+=]/g,
                                                                    ""
                                                                ) +
                                                                "\n\nReservas:\n" +
                                                                JSON.stringify(filtroReservas)
                                                                .replace(/,/g, "\n")
                                                                .replace(/"/g, "")
                                                                .replace(/jogador/g, "")
                                                                .replace(/{/g, "")
                                                                .replace(/}/g, "")
                                                                .replace(/:/g, "")
                                                                .replace(
                                                                    /[\[\]!'@,><://\\;&*()_+=]/g,
                                                                    ""
                                                                ) +
                                                                "\n\n_🤖 Parciais fornecidas por SCCoty (wa.me/19282855516)_"
                                                            );
                                                        })
                                                        .catch((err) => {});
                                                })
                                                .catch((err) => {
                                                    console.log(err);
                                                    // message.reply(
                                                    //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                                    // );
                                                });
                                        })
                                        .catch((err) => {
                                            console.log(err);
                                            // message.reply(
                                            //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                            // );
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
                console.log(err);
                // message.reply(
                //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                // );
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
                        `👕 Os *mais escalados* da rodada são:\n\n${mensagem}\n\n_🤖 Via SCCoty (wa.me/19282855516)_`
                    );
                })
                .catch((err) => {
                    // message.reply(
                    //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                    // );
                });
        }

        //trazer algumas informações de um time
        if (message.body.includes("!info")) {
            let time = message.body
                .replace("!info", "")
                .replace(/^./, "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            let slug = time.replace(/ /g, "-").toLowerCase();

            axios
                .get(env.API_URL + "mercado/status")
                .then((res) => {
                    let rodadaAtual = res.data.rodada_atual;
                    let rodadas = Array.from(Array(rodadaAtual - 1), (e, i) => i + 1);

                    axios
                        .get(env.API_URL + "times?q=" + slug)
                        .then(async(res) => {
                            if (res.data.length !== 0) {
                                let timeCartola = res.data.filter(
                                    (item) =>
                                    item.slug === slug ||
                                    item.nome.toLowerCase() === time.toLowerCase()
                                );

                                if (timeCartola && timeCartola.length !== 0) {
                                    let time_id = timeCartola[0].time_id;
                                    let maiorPontuacao = 0;
                                    let menorPontuacao = 0;
                                    let pontuacoes = [];

                                    axios
                                        .get(env.API_URL + "time/id/" + time_id)
                                        .then(async(res) => {
                                            let pontuacaoGeral = res.data.pontos_campeonato;
                                            let patrimonio = res.data.patrimonio;
                                            let nomeCartoleiro = res.data.time.nome_cartola;
                                            let nomeTime = res.data.time.nome;
                                            let anoInicio = res.data.time.temporada_inicial;
                                            let mediaPontuacao = pontuacaoGeral / (rodadaAtual - 1);

                                            const promiseArray = rodadas.map((rdd) =>
                                                axios.get(
                                                    env.API_URL + "/time/id/" + time_id + "/" + rdd
                                                )
                                            );

                                            (await Promise.all(promiseArray)).map((res) =>
                                                pontuacoes.push(res.data.pontos)
                                            );

                                            maiorPontuacao = Math.max(...pontuacoes);
                                            menorPontuacao = Math.min(...pontuacoes);

                                            message.reply(
                                                `🛡️ *${nomeTime}* \n🎩 Cartoleiro: ${nomeCartoleiro}\n_Cartoleiro desde ${anoInicio}_\n\n🧮 *Estatísticas da temporada*\n\n📊 Pontuação geral: ${pontuacaoGeral.toFixed(
                            2
                          )}\n💰 Patrimônio: ${patrimonio}\n📊 Média por rodada: ${mediaPontuacao.toFixed(
                            2
                          )}\n📈 Maior pontuação: ${maiorPontuacao.toFixed(
                            2
                          )}\n📉 Menor pontuação: ${menorPontuacao.toFixed(
                            2
                          )}\n\n_🤖 Via SCCoty (wa.me/19282855516)_`
                                            );
                                        })
                                        .catch((err) => {
                                            // message.reply(
                                            //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                                            // );
                                        });
                                } else {
                                    message.reply(
                                        "⚠️🤖❓ Desculpe, não consegui localizar esse time :( Verifique a grafia e tente novamente."
                                    );
                                }
                            } else {
                                message.reply(
                                    "⚠️🤖❓ Desculpe, não consegui localizar esse time :( Verifique a grafia e tente novamente."
                                );
                            }
                        })
                        .catch((err) => {
                            // message.reply(
                            //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                            // );
                        });
                })
                .catch((err) => {
                    // message.reply(
                    //     "⚠️🤖❓\nDesculpe, algo de errado aconteceu no meu sistema e não pude realizar sua solicitação :("
                    // );
                });
        }
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
    2
}