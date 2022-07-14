# SCCoty - BOT do Cartola FC para Whatsapp!

<img src = "https://uploaddeimagens.com.br/images/003/942/100/full/WhatsApp_Image_2022-07-14_at_13.11.25.jpeg?1657815402" width = "300px">

### Funcionamento: 
https://drive.google.com/file/d/1TKeq2Ynp5GY5KF0dW-IsuWpycxE3St5Y/view?usp=sharing

### Motivação: 
Sendo um usuário ativo do Whatsapp e viciado em Cartola FC, resolvi criar uma integração entre as plataformas para realizar algo que costumo fazer várias vezes durante a rodada: abrir o aplicativo do fantasy para verificar a pontuação parcial do meu time ou de um jogador específico.
Para resolver tal problemática, desenvolvi um sistema de BOT via Whatsapp em que consigo consultar essa parcial em tempo real apenas enviando uma mensagem.

### Desafios: 

- API não documentada; requisições a várias rotas distintas para chegar na informação final (parcial da rodada)
- Implementar a regra de negócio do banco de reservas (substituições) e capitão

### Tecnologias:

- Node.JS
- Biblioteca whatsapp-web.js 
- Axios

## Como utilizar 

- Clone esse repositório
- Altere o arquivo .env e adicione o ID do grupo em que deseja utilizar em um dos parâmetros "ID_GROUP_SCC", ou simplesmente remova o código que está dentro do If que começa na linha 29 do app.js; Essa verificação faz com que o bot só funcione em grupos específicos, caso deseje utilizar em qualquer chat, só precisa remover essa validação.  
- Abra a pasta do projeto e rode o comando "npm install"
- Rode o comando "npm run dev", caso esteja em ambiente de testes; ou "npm run start" caso não
- Escaneie o QR CODE que irá aparecer no terminal (essa ação só será necessária uma única vez), realize essa ação como se estivesse logando no Whatsapp Web.
- Aproveite o BOT :)
