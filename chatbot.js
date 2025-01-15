const express = require('express');
const qrcode = require('qrcode'); // Para gerar o QR Code como imagem
const { Client } = require('whatsapp-web.js');
const app = express();
const port = 3000; // Porta onde o servidor vai rodar

// Criação do cliente WhatsApp
const client = new Client();

// Variável para armazenar o QR Code gerado
let currentQR = null;

// Flag para ativar/desativar o chatbot
let isBotActive = true;  // O bot está ativo inicialmente
let lastInteractionTime = null; // Armazena o tempo da última interação do cliente

// Tempo em milissegundos para reativar o bot (2 minutos)
const REACTIVATE_TIMEOUT = 2 * 60 * 1000; // 2 minutos em milissegundos

// Lista de números de administradores (caso queira permitir apenas para certos números)
const adminNumbers = ['+5511973752898'];  // Adicione os números permitidos aqui

// Evento que dispara quando o QR Code é gerado
client.on('qr', qr => {
    // Gerar o QR Code como uma imagem base64
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Erro ao gerar QR Code:', err);
            return;
        }
        currentQR = url;  // Armazena a imagem do QR Code gerada
        console.log('QR Code gerado e pronto para exibição.');
    });
});

// Evento quando o WhatsApp Web está pronto
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Inicializa o cliente do WhatsApp
client.initialize();

// Função para simular delay entre as ações
const delay = ms => new Promise(res => setTimeout(res, ms));

// Rota HTTP para servir o QR Code
app.get('/qr', (req, res) => {
    if (currentQR) {
        res.status(200).send(`<img src="${currentQR}" alt="QR Code para WhatsApp">`);
    } else {
        res.status(400).send('QR Code ainda não disponível. Aguarde a geração.');
    }
});

// Endpoint para verificar se o cliente do WhatsApp está conectado
app.get('/status', (req, res) => {
    if (client.info && client.info.pushname) {
        res.status(200).send(`WhatsApp conectado como ${client.info.pushname}`);
    } else {
        res.status(400).send('WhatsApp não conectado.');
    }
});

// Servir a aplicação na porta configurada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Função para reativar o bot automaticamente após 2 minutos de inatividade
const checkInactivity = () => {
    if (!isBotActive) {
        const currentTime = Date.now();
        // Verifica se já passou 2 minutos (120000 ms) desde a última interação
        if (lastInteractionTime && (currentTime - lastInteractionTime) >= REACTIVATE_TIMEOUT) {
            isBotActive = true;  // Reativa o bot
            console.log('Bot reativado após 2 minutos de inatividade.');
        }
    }
};

// Função de automação do chatbot
client.on('message', async msg => {
    // Atualiza o tempo da última interação
    lastInteractionTime = Date.now();

    // Verifica se o chatbot está ativo
    if (!isBotActive) {
        console.log('Bot desativado, não respondendo.');
        return;  // Não faz nada, pois o bot está desativado
    }

    // Caso o número seja um administrador, o bot deve ser desativado
    if (adminNumbers.includes(msg.from)) {
        console.log('Mensagem de administrador recebida, desativando o bot...');
        isBotActive = false;  // Desativa o chatbot
        await msg.reply('O chatbot foi desativado. Envie algo para reativá-lo.');
        return;
    }

    // Caso contrário, processa as mensagens normalmente
    if (msg.body.match(/(menu|Menu|dia+a*|tarde+e*|noite+e*|oi+i*|Oi+i*|Olá|olá|ola+a*|Ola+a*|Eae+e*|eae+e*)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        const contact = await msg.getContact();
        const name = contact.pushname;
        await client.sendMessage(msg.from, `Olá! ${name.split(" ")[0]} Bem-vindo a *Molinari Details*. Um de nossos atendentes já vai falar com você, mas fique à vontade para conferir nosso catálogo de serviços:\n\n1 - Ver serviços\n2 - Outros assuntos`);
        // await delay(3000);
        // await chat.sendStateTyping();
        // await delay(5000);
    }

    if (msg.body === '1' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 'Catálogo de serviços: https://auto-service-design.web.app/services');
    }

    if (msg.body === '2' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 'Sobre o que gostaria de falar? Deixe uma mensagem e iremos te atender em instantes!');
    }
});

// Chama a função de inatividade a cada 2 minutos (120000 ms)
setInterval(checkInactivity, 120000);
