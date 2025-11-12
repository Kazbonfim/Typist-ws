const dotenv = require('dotenv').config();
const { channel } = require('diagnostics_channel');
const express = require('express');
const path = require('path');
const pino = require('pino')();
const pinoHttp = require('pino-http');
const { Server } = require('socket.io');


const app = express();

const PORT = process.env.DEV_PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
// Logger


app.get('/', (req, res) => {
    // req.log.info('Requisição GET / recebida');

    res.sendFile(path.join(__dirname, './views/index.html'));

    // res.status(200).json({
    //     message: "Hello, world!"
    // })
})

// Iniciando servidor
const server = app.listen(PORT, () => {
    // pino.info("Servidor rodando na porta %d", PORT)
});

// Iniciando Socket.io, usando o próprio listen do Express
const io = new Server(server);

const updateUsersCount = () => {
    const count = io.engine.clientsCount;

    io.emit('users_count', count);
    pino.info("Usuários conectados: %d", count);
}

io.on('connection', (socket) => {
    // Log detalhado
    pino.info("Novo cliente conectado: %s", socket.id);
    // Log simples
    pino.info("Usuário conectado");

    updateUsersCount();

    // Função para entrar em uma sala
    socket.on('join_room', (roomName) => {
        // Entrar na sala
        socket.join(roomName);
        pino.info("Usuário entrou na sala/canal: %s", socket.id, roomName);

        // Opcional
        socket.emit('chat_message', {
            username: 'Sistema',
            mensagem: 'Você entrou no canal: ' + roomName,
            channel: roomName,
        })

    });

    socket.on('leave_room', (roomName) => {
        // Usa o método .leave() para remover o socket da sala
        socket.leave(roomName);
        pino.info("Usuário %s saiu da sala/canal: %s", socket.id, roomName);

        // Opcional: Avisar a sala que o usuário saiu (apenas se a sala ainda tiver membros)
        io.to(roomName).emit('chat_message', {
            username: 'Sistema',
            mensagem: `Usuário ${socket.id.slice(0, 8)} saiu do canal.`,
            channel: roomName
        });
    });

    // Atualizar o contador de usuários conectados
    socket.on('disconnect', () => {
        pino.info("Usuário desconectado: %s", socket.id);
        updateUsersCount();
    })

    // Escutar pelo EMIT vindo do frontend que contenha 'new_message' como ponteiro
    socket.on('new_message', (msgData) => {

        const channel = msgData.channel;
        // Mudando o canal conforme payload recebido 
        io.to(channel).emit('chat_message', msgData)
        console.log(`${msgData.username} disse: ${msgData.mensagem}, na sala ${msgData.channel}`);

        // É assim que faz a emissão? 
        // SIM, é assim.
        // io.emit('chat_message', msgData)
        // console.log(`${msgData.username} disse: ${msgData.mensagem}`);
    });
})

