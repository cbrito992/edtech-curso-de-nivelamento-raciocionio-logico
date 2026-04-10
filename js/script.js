// --- PROTEÇÃO CONTRA REFRESH (ANTI-CHEAT) ---
if (performance.getEntriesByType("navigation")[0] && performance.getEntriesByType("navigation")[0].type === "reload") {
    sessionStorage.setItem('game_score', 0);
    sessionStorage.setItem('correct_count', 0); // Zera também a contagem de acertos
    window.location.href = 'index.html';
}
// --------------------------------------------

// Recupera os dados da memória do navegador
let score = parseInt(sessionStorage.getItem('game_score')) || 0;
let correctCount = parseInt(sessionStorage.getItem('correct_count')) || 0;

// Configurações de tempo e estado
let timeLeft = 180;
let timerInterval;
let opcaoSelecionada = null;
let jaRespondeu = false;
let acertouQuestaoAtual = false;

// --- FUNÇÃO AUXILIAR DE ÁUDIO ---
function tocarSom(idDoElementoAudio) {
    let som = document.getElementById(idDoElementoAudio);
    if (som) {
        som.currentTime = 0;
        som.play().catch(e => console.log("Áudio bloqueado", e));
    }
}

// Inicia o cronômetro assim que a página carrega
window.onload = function() {
    // Se estiver na tela final, carrega o relatório em vez do timer
    if (document.getElementById('final-rank-title')) {
        carregarRelatorioFinal();
    } else {
        atualizarPlacarETempo();
        timerInterval = setInterval(() => {
            timeLeft--;
            atualizarPlacarETempo();
            if (timeLeft <= 0) {
                timeLeft = 0;
                clearInterval(timerInterval);
                tempoEsgotado();
            }
        }, 1000);
    }
};

function atualizarPlacarETempo() {
    let uiScore = document.getElementById('score-display');
    let uiTimer = document.getElementById('timer-display');
    let timeBar = document.getElementById('time-bar');
    let scoreBar = document.querySelector('.score-fill');

    if (uiScore) uiScore.innerText = score + " pts";
    if (uiTimer) {
        let s = Math.max(0, timeLeft).toString().padStart(2, '0');
        uiTimer.innerText = s + "s";

        let timerColor = 'var(--accent-blue)';
        if (timeLeft <= 60) timerColor = 'var(--error)';
        else if (timeLeft <= 120) timerColor = 'var(--warning)';

        uiTimer.style.color = timerColor;
        if (timeBar) {
            let percentage = (timeLeft / 180) * 100;
            timeBar.style.width = percentage + "%";
            timeBar.style.backgroundColor = timerColor;
        }
    }
    if (scoreBar) {
        let scorePercentage = Math.max(0, Math.min(100, (score / 100) * 100));
        scoreBar.style.width = scorePercentage + "%";
    }
}

function selecionarOpcao(elemento) {
    if (jaRespondeu) return;
    tocarSom('snd-btn-padrao');
    opcaoSelecionada = elemento;
    let opcoes = document.querySelectorAll('.option');
    opcoes.forEach(op => op.classList.remove('selected'));
    elemento.classList.add('selected');
    let btn = document.getElementById('action-btn');
    btn.disabled = false;
    btn.classList.add('active-ready');
}

function confirmarResposta() {
    if (jaRespondeu || !opcaoSelecionada) return;
    jaRespondeu = true;
    clearInterval(timerInterval);

    document.getElementById('options-container').classList.add('locked');
    let opcoes = document.querySelectorAll('.option');

    opcoes.forEach(op => {
        op.style.pointerEvents = 'none';
        let iconCheck = op.querySelector('.correct-icon');
        if (iconCheck) iconCheck.src = 'img/IconCheck.svg';
    });

    acertouQuestaoAtual = opcaoSelecionada.getAttribute('data-correct') === "true";

    opcoes.forEach(op => {
        if (op.getAttribute('data-correct') === "true") op.classList.add('correct');
        else if (op === opcaoSelecionada) op.classList.add('wrong');
    });

    document.getElementById('action-btn').classList.add('hidden');
    document.getElementById('feedback-area').classList.remove('hidden');

    let box = document.getElementById('feedback-box');
    let title = document.getElementById('feedback-title');
    let icon = document.getElementById('feedback-icon');
    let points = document.getElementById('feedback-points');
    let innerEstudoBtn = document.getElementById('btn-inner-estudo');

    if (acertouQuestaoAtual) {
        tocarSom('snd-correct');
        score += 10;
        correctCount++; // Incrementa contador de acertos
        box.className = "feedback-result-box correct";
        title.innerText = "Análise correta!";
        icon.src = "img/AnaliseCorreta_icon.png";
        points.innerText = "+10 pontos";
        if (innerEstudoBtn) innerEstudoBtn.classList.add('hidden');
    } else {
        tocarSom('snd-incorrect');
        score -= 5;
        box.className = "feedback-result-box wrong";
        title.innerText = "Análise incorreta!";
        icon.src = "img/Analise incorreta_icon.png";
        points.innerText = "-5 pontos";
        if (innerEstudoBtn) innerEstudoBtn.classList.remove('hidden');
    }

    sessionStorage.setItem('game_score', score);
    sessionStorage.setItem('correct_count', correctCount);
    atualizarPlacarETempo();
}

function tempoEsgotado() {
    if (jaRespondeu) return;
    tocarSom('snd-incorrect');
    jaRespondeu = true;
    score -= 5;
    sessionStorage.setItem('game_score', score);
    atualizarPlacarETempo();

    let opcoes = document.querySelectorAll('.option');
    opcoes.forEach(op => op.style.pointerEvents = 'none');
    document.getElementById('action-btn').disabled = true;

    document.getElementById('modal-estudo').classList.remove('hidden');
    document.querySelector('.modal-title-yellow').innerText = "TEMPO ESGOTADO!";

    let contentContainer = document.getElementById('modal-text-content');
    if(contentContainer){
        contentContainer.innerHTML = "<p>Você demorou muito para analisar as evidências. A precisão é fundamental, mas a rapidez também.</p><p style='color: #ef4444; font-weight: bold;'>-5 pontos</p>";
        contentContainer.classList.remove('hidden');
    }

    document.getElementById('video-iframe-container').classList.add('hidden');
    let watchBtn = document.getElementById('btn-watch-video');
    if(watchBtn){
        watchBtn.innerHTML = "Tentar Próximo Caso";
        watchBtn.classList.remove('hidden');
        watchBtn.onclick = function() {
            tocarSom('snd-btn-padrao');
            setTimeout(() => { window.location.href = configCaso.proximaPagina; }, 200);
        };
    }
}

function acaoAposResposta() {
    tocarSom('snd-btn-padrao');
    setTimeout(() => { window.location.href = configCaso.proximaPagina; }, 200);
}

// FUNÇÕES DO MODAL
function abrirEstudo() {
    tocarSom('snd-btn-padrao');
    document.getElementById('modal-estudo').classList.remove('hidden');
    document.querySelector('.modal-title-yellow').innerText = "ESTUDO DE CASO";
    let textContent = document.getElementById('modal-text-content');
    let watchBtn = document.getElementById('btn-watch-video');
    if(textContent) textContent.classList.remove('hidden');
    if(watchBtn) watchBtn.classList.remove('hidden');
    document.getElementById('video-iframe-container').classList.add('hidden');
    document.getElementById('video-iframe').src = "";
}

function abrirIframeVideo(url) {
    tocarSom('snd-btn-padrao');
    let textContent = document.getElementById('modal-text-content');
    let btnWatch = document.getElementById('btn-watch-video');
    let iframeContainer = document.getElementById('video-iframe-container');
    let iframe = document.getElementById('video-iframe');
    if(textContent) textContent.classList.add('hidden');
    if(btnWatch) btnWatch.classList.add('hidden');
    iframe.src = url;
    if(iframeContainer) iframeContainer.classList.remove('hidden');
}

function fecharModal() {
    tocarSom('snd-btn-fechar');
    document.getElementById('modal-estudo').classList.add('hidden');
    document.getElementById('video-iframe').src = "";
    document.getElementById('video-iframe-container').classList.add('hidden');
    let textContent = document.getElementById('modal-text-content');
    let btnWatch = document.getElementById('btn-watch-video');
    if(textContent) textContent.classList.remove('hidden');
    if(btnWatch) btnWatch.classList.remove('hidden');
}

// --- FUNÇÕES DA TELA FINAL ---
function carregarRelatorioFinal() {
    const finalScore = parseInt(sessionStorage.getItem('game_score')) || 0;
    const finalCorrect = parseInt(sessionStorage.getItem('correct_count')) || 0;
    const finalWrong = 10 - finalCorrect;

    const uiTitle = document.getElementById('final-rank-title');
    const uiScore = document.getElementById('final-score');
    const uiCorrect = document.getElementById('final-correct');
    const uiWrong = document.getElementById('final-wrong');

    if(uiScore) uiScore.innerText = finalScore;
    if(uiCorrect) uiCorrect.innerText = finalCorrect + "/10";
    if(uiWrong) uiWrong.innerText = finalWrong + "/10";

    let rank = "";
    if (finalCorrect <= 2) rank = "Detetive Aprendiz";
    else if (finalCorrect <= 4) rank = "Detetive Júnior";
    else if (finalCorrect <= 6) rank = "Detetive Pleno";
    else if (finalCorrect <= 8) rank = "Detetive Senior";
    else rank = "Detetive Mestre";

    if(uiTitle) uiTitle.innerText = rank;
}

function reiniciarJogo() {
    tocarSom('snd-btn-padrao');
    sessionStorage.setItem('game_score', 0);
    sessionStorage.setItem('correct_count', 0);
    setTimeout(() => { window.location.href = 'index.html'; }, 200);
}