// Lógica do Chat
const socket = io();

// Sons
const audio = new Audio('sound1.mp3');
const sound1Play = () => {
    audio.currentTime = 0;
    audio.play()
        .then(() => {
            console.log("Música tocada com sucesso!");
        })
        .catch(error => {
            // Isso geralmente acontece se o navegador bloquear o autoplay
            console.error("Erro ao tentar tocar a mídia:", error);
        });
}

// const msgSystem = document.getElementById('msgSystem')

// setTimeout(()=>{
//     msgSystem.classList.add('hiddenMsg');
// }, 1000)

// Sistema contador de usuários, se conecta ao EVENTO user_count no backend
const usersCountElement = document.getElementById('usersCount');
// Escuta os eventos vindos do backend
socket.on('users_count', (count) => {
    if ('usersCountElement') {
        usersCountElement.textContent = count;
        console.log("Usuários ativos neste momento:", count);
    }
})

const form = document.getElementById('form');
const username = document.getElementById('username');
const mensagem = document.getElementById('mensagem');
const channel = document.getElementById('channel');
const historico = document.getElementById('messageDisplay');

// Gerando um nome RANDOM caso o usuário não defina um
const crypto = window.crypto.randomUUID().slice(0, 8);
username.value = crypto;
// Gerando um channel RANDOM caso o usuário não defina um, ele deve compartilhar isso
const defaultChannel = window.crypto.randomUUID().slice(0, 12);
channel.value = defaultChannel;

// channel.value = 'default'

// Variável para rastrear o canal atual do usuário
let currentChannel = channel.value;

channel.addEventListener('blur', () => {

    const newChannel = channel.value.trim();

    // 1. Verificar se o canal realmente mudou
    if (newChannel && newChannel !== currentChannel) {

        console.log(`Tentando mudar do canal: ${currentChannel} para ${newChannel}`);

        // 2. Avisar o servidor para SAIR da sala antiga (se houver uma)
        if (currentChannel) {
            socket.emit('leave_room', currentChannel);
        }

        // 3. Avisar o servidor para ENTRAR na sala nova
        socket.emit('join_room', newChannel);

        // 4. Atualizar o estado do canal atual
        currentChannel = newChannel;

    } else if (!newChannel) {
        // Opcional: Tratar caso o campo fique vazio
        console.warn('O nome do canal não pode ser vazio.');
        channel.value = currentChannel; // Restaura o valor
    }
});

socket.on('connect', () => {
    socket.emit('join_room', currentChannel);
    console.log('Entrando na sala: ' + currentChannel);
})

// Evita o recarregamento natural da página ao enviar mensagens
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Cria um objeto usuário antes
    const newMessage = {
        username: username.value,
        mensagem: mensagem.value,
        channel: channel.value,
    }

    console.log(newMessage);

    // Socket.io EMIT
    if (mensagem.value) {
        // Envia um EMIT ao backend contendo o valor do campo de mensagens
        socket.emit('new_message', newMessage);

        // Limpa o campo depois de enviar a mensagem
        mensagem.value = '';
    }
});

// Emit padrão 'chat_message'
// Capturar mensagens e exibir na área de bate-papo
socket.on('chat_message', (msgData) => {

    sound1Play();

    const currentChannel = channel.value.trim();

    if (msgData.channel !== currentChannel && msgData.username !== 'Sistema') {
        console.log('Mensagem para outros canais ignorada' + msgData.channel);
        return;
    }

    // 1. Identificar Remetente
    // O usuário atual é quem digitou o nome no input.
    const currentUser = username.value.trim();
    const isSelf = msgData.username === currentUser;

    // 2. Definir Classes e Conteúdo
    const alertClass = isSelf ? 'alert-primary border-primary' : 'alert-secondary border-secondary';
    const badgeClass = isSelf ? 'bg-primary' : 'bg-secondary';
    const senderName = isSelf ? 'Você' : msgData.username;
    const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 3. Renderizar o HTML
    const messageElement = document.createElement('div');

    // Adicionar as classes dinâmicas e a estrutura HTML
    messageElement.classList.add('alert', 'mb-2', 'p-2', ...alertClass.split(' '));
    messageElement.setAttribute('role', 'alert');

    messageElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
                <span class="badge ${badgeClass} me-2">${senderName || 'Anônimo'}</span>
            </h6>
            <small class="text-muted">${date}</small>
        </div>
        <p class="mx-3 my-1">${msgData.mensagem}</p>
    `;

    // Inserir no histórico
    messageDisplay.appendChild(messageElement);

    // Rolar automaticamente para a última mensagem
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
});