'use strict'; // Modo estrito — ajuda a pegar erros de digitação no código

/* ================================================
   SOULFRAME KEYBOARD — main.js v2.0
   Criado por: Thierry Oliveira (ThierryDev)

   O que este arquivo faz:
   - Controla a troca de idioma (LAT / ODE / ROS)
   - Aplica as fontes de runas nas teclas e no display
   - Faz as teclas virtuais digitarem no display
   - Intercepta o teclado físico do computador
   - Salva e carrega o histórico de traduções
   - Controla o botão de copiar e o toast de confirmação
   - Salva o rascunho para não perder ao recarregar
   ================================================ */


/* ------------------------------------------------
   ELEMENTOS DO DOM
   Aqui eu pego cada elemento da página pelo ID
   para poder manipulá-los no código abaixo.
   ------------------------------------------------ */
const display     = document.getElementById('display');           // caixa de texto onde aparece a tradução
const teclas      = document.querySelectorAll('.tecla[data-key]'); // todas as teclas que têm letra (A-Z)
const ptSf        = document.getElementById('pt-sf');             // botão de trocar idioma
const limpar      = document.getElementById('limpar');            // botão Clear
const espaco      = document.getElementById('espaco');            // botão Space
const titulo      = document.getElementById('titulo');            // título "Soulframe Keyboard"
const btnCopy     = document.getElementById('btn-copy');          // botão Copy
const toast       = document.getElementById('toast');             // notificação de "copiado!"
const toastMsg    = document.getElementById('toast-msg');         // texto dentro do toast
const histCont    = document.getElementById('historico-container'); // caixa do histórico
const histLista   = document.getElementById('historico-lista');   // lista de itens do histórico
const btnClrHist  = document.getElementById('btn-clear-history'); // botão limpar histórico (em cima)
const btnClrHist2 = document.getElementById('btn-clear-history2'); // botão limpar histórico (dentro do painel)


/* ------------------------------------------------
   IDIOMAS
   Os 3 scripts disponíveis.
   idiomaAtual guarda o índice (0, 1 ou 2).
   Começa em LAT (índice 0).
   ------------------------------------------------ */
const idiomas = ['LAT', 'ODE', 'ROS'];
let idiomaAtual = 0;


/* ------------------------------------------------
   HISTÓRICO
   Máximo de 15 entradas salvas.
   Carrega do localStorage ao abrir a página —
   assim o histórico não some ao fechar o navegador.
   ------------------------------------------------ */
const HISTORY_MAX = 15;
let historico = [];
try {
    historico = JSON.parse(localStorage.getItem('sf-kb:history') || '[]');
} catch {
    // Se der erro (ex: localStorage bloqueado), começa com lista vazia
}


/* ------------------------------------------------
   APLICAR FONTE
   Chamada toda vez que o idioma muda.
   Adiciona a classe certa em todos os elementos
   que precisam mudar de fonte: display, título,
   espaço e todas as teclas.

   LAT  → sem classe especial (usa a fonte padrão Arial)
   ODE  → classe "sf-ativo"   (usa FonteSoulframe.ttf)
   ROS  → classe "novo-ativo" (usa FonteRose.ttf)
   ------------------------------------------------ */
function aplicarFonte(id) {
    const idioma = idiomas[id];
    const isSF   = idioma === 'ODE';  // é o alfabeto ODE?
    const isROS  = idioma === 'ROS';  // é o alfabeto ROS?

    // Remove as classes de fonte de todos os elementos primeiro
    display.classList.remove('sf-ativo', 'novo-ativo');
    titulo.classList.remove('sf-ativo', 'novo-ativo');
    espaco.classList.remove('sf-ativo', 'novo-ativo');
    teclas.forEach(t => t.classList.remove('sf-ativo', 'novo-ativo'));

    // Adiciona a classe do idioma escolhido
    if (isSF) {
        display.classList.add('sf-ativo');
        titulo.classList.add('sf-ativo');
        espaco.classList.add('sf-ativo');
        teclas.forEach(t => t.classList.add('sf-ativo'));
    }

    if (isROS) {
        display.classList.add('novo-ativo');
        titulo.classList.add('novo-ativo');
        espaco.classList.add('novo-ativo');
        teclas.forEach(t => t.classList.add('novo-ativo'));
    }
}


/* ------------------------------------------------
   BOTÃO DE TROCAR IDIOMA
   Cada clique avança para o próximo idioma na lista.
   O botão mostra o PRÓXIMO idioma disponível
   (comportamento original da v1, mantido na v2).

   Exemplo:
   Idioma ativo = LAT → botão mostra "ODE"
   Idioma ativo = ODE → botão mostra "ROS"
   Idioma ativo = ROS → botão mostra "LAT"
   ------------------------------------------------ */
ptSf.addEventListener('click', () => {
    // Avança para o próximo idioma (volta ao início quando chega no fim)
    idiomaAtual = (idiomaAtual + 1) % idiomas.length;

    // Calcula qual é o próximo para mostrar no botão
    const proximo = idiomas[(idiomaAtual + 1) % idiomas.length];
    ptSf.textContent = proximo;

    // Aplica a nova fonte em tudo
    aplicarFonte(idiomaAtual);
});


/* ------------------------------------------------
   BOTÃO CLEAR
   Apaga todo o texto do display.
   Antes de apagar, salva no histórico para não perder.
   ------------------------------------------------ */
limpar.addEventListener('click', () => {
    const texto = display.value.trim();
    if (texto) adicionarHistorico(texto, idiomas[idiomaAtual]); // salva antes de apagar
    display.value = '';
    syncBotoes();
    try { sessionStorage.removeItem('sf-kb:draft'); } catch {} // limpa o rascunho salvo
});


/* ------------------------------------------------
   TECLAS VIRTUAIS (A-Z)
   Cada tecla tem data-key com a letra.
   Ao clicar, adiciona a letra no final do display.
   ------------------------------------------------ */
teclas.forEach(tecla => {
    tecla.addEventListener('click', () => {
        const letra = tecla.dataset.key;
        if (!letra) return;
        display.value += letra;
        syncBotoes();
        salvarRascunho();
    });
});


/* ------------------------------------------------
   BOTÃO ESPAÇO
   Adiciona um espaço no texto.
   ------------------------------------------------ */
espaco.addEventListener('click', () => {
    display.value += ' ';
    syncBotoes();
    salvarRascunho();
});


/* ------------------------------------------------
   TECLADO FÍSICO DO COMPUTADOR
   Intercepta as teclas digitadas no teclado real.
   Funciona igual às teclas virtuais.

   Backspace → apaga o último caractere
   Espaço    → adiciona espaço
   A-Z / a-z → adiciona a letra em maiúsculo
   ------------------------------------------------ */
document.addEventListener('keydown', e => {

    // Se Ctrl ou Cmd (Mac) estiver pressionado, não intercepta nada.
    // Isso permite Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Z etc funcionarem normalmente.
    if (e.ctrlKey || e.metaKey) return;

    // Backspace: apaga o último caractere
    if (e.key === 'Backspace') {
        e.preventDefault(); // evita o navegador voltar de página
        display.value = display.value.slice(0, -1);
        syncBotoes();
        salvarRascunho();
        return;
    }

    // Espaço
    if (e.key === ' ') {
        e.preventDefault(); // evita rolar a página
        display.value += ' ';
        syncBotoes();
        salvarRascunho();
        return;
    }

    // Qualquer letra A-Z (maiúscula ou minúscula — converte para maiúscula)
    if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        display.value += e.key.toUpperCase();
        syncBotoes();
        salvarRascunho();
        return;
    }
});


/* ------------------------------------------------
   SYNC DOS BOTÕES
   Habilita ou desabilita o botão Copy
   dependendo se há texto no display.
   ------------------------------------------------ */
function syncBotoes() {
    const temConteudo = display.value.length > 0;
    btnCopy.disabled = !temConteudo;
}


/* ------------------------------------------------
   RASCUNHO (DRAFT)
   Salva o texto do display no sessionStorage.
   O sessionStorage dura enquanto a aba estiver aberta —
   se recarregar a página, o texto volta.
   Se fechar a aba/navegador, some (proposital).
   ------------------------------------------------ */
function salvarRascunho() {
    try {
        sessionStorage.setItem('sf-kb:draft', display.value);
    } catch {} // silencioso se sessionStorage não estiver disponível
}

function restaurarRascunho() {
    try {
        const draft = sessionStorage.getItem('sf-kb:draft');
        if (draft) {
            display.value = draft;
            syncBotoes();
        }
    } catch {}
}


/* ------------------------------------------------
   COPIAR TEXTO
   Tenta usar a API moderna (navigator.clipboard).
   Se não funcionar (navegadores antigos), usa o
   método legado com execCommand.
   Após copiar: mostra o toast e muda a cor do botão.
   ------------------------------------------------ */
btnCopy.addEventListener('click', () => {
    if (!display.value) return;
    copiarTexto(display.value);
});

async function copiarTexto(texto) {
    try {
        // Método moderno — funciona em Chrome, Firefox, Safari atuais
        await navigator.clipboard.writeText(texto);
    } catch {
        // Fallback para navegadores mais antigos
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
    }

    // Mostra a notificação de confirmação
    mostrarToast('Copied to clipboard!');

    // Muda a cor do botão para verde por 1.5 segundos
    btnCopy.classList.add('copiado');
    setTimeout(() => btnCopy.classList.remove('copiado'), 1500);
}


/* ------------------------------------------------
   TOAST (notificação de confirmação)
   Aparece na parte inferior da tela por 2.2 segundos
   e some sozinho.
   ------------------------------------------------ */
let toastTimer = null; // guarda o timer para poder cancelar se aparecer de novo

function mostrarToast(msg) {
    toastMsg.textContent = msg;
    toast.setAttribute('aria-hidden', 'false'); // leitores de tela anunciam
    toast.classList.add('visivel');

    // Cancela o timer anterior se o toast for acionado rapidamente de novo
    clearTimeout(toastTimer);

    // Some após 2.2 segundos
    toastTimer = setTimeout(() => {
        toast.classList.remove('visivel');
        toast.setAttribute('aria-hidden', 'true');
    }, 2200);
}


/* ------------------------------------------------
   HISTÓRICO DE TRADUÇÕES
   Salva no localStorage — persiste entre sessões.
   Máximo de 15 entradas.
   Não salva a mesma tradução duas vezes seguidas.
   ------------------------------------------------ */
function adicionarHistorico(texto, lang) {
    if (!texto.trim()) return; // ignora texto vazio

    // Evita duplicar a última entrada
    if (historico[0] && historico[0].texto === texto) return;

    // Adiciona no início da lista (mais recente primeiro)
    historico.unshift({ texto, lang, ts: Date.now() });

    // Mantém no máximo 15 entradas
    if (historico.length > HISTORY_MAX) {
        historico = historico.slice(0, HISTORY_MAX);
    }

    // Salva no localStorage
    try {
        localStorage.setItem('sf-kb:history', JSON.stringify(historico));
    } catch {}

    renderizarHistorico();
}

function renderizarHistorico() {
    histLista.innerHTML = ''; // limpa a lista antes de redesenhar

    if (historico.length === 0) {
        // Esconde o painel se não tiver nada
        histCont.style.display = 'none';
        btnClrHist.style.display = 'none';
        return;
    }

    // Mostra o painel e o botão de limpar
    histCont.style.display = 'block';
    btnClrHist.style.display = 'inline-flex';

    // Cria um item na lista para cada entrada do histórico
    historico.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.className = 'historico-item';

        // Escapa caracteres especiais para evitar problemas de HTML
        const textoEscapado = entry.texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        // Monta o HTML do item: texto + badge do idioma + botão de copiar
        li.innerHTML = `
            <span class="historico-item__texto" title="${textoEscapado}">${textoEscapado}</span>
            <span class="historico-item__meta">
                <span class="historico-item__lang">${entry.lang}</span>
                <button class="historico-item__copiar" data-idx="${idx}" title="Copy" aria-label="Copy this translation">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
            </span>`;
        histLista.appendChild(li);
    });
}

// Detecta clique no botão de copiar de cada item do histórico
// Usa delegação: um único listener na lista em vez de um por botão
histLista.addEventListener('click', e => {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const entry = historico[parseInt(btn.dataset.idx, 10)];
    if (entry) copiarTexto(entry.texto);
});

function limparHistorico() {
    historico = [];
    try { localStorage.removeItem('sf-kb:history'); } catch {}
    renderizarHistorico();
}

// Dois botões de limpar histórico (o de cima e o dentro do painel)
btnClrHist.addEventListener('click', limparHistorico);
if (btnClrHist2) btnClrHist2.addEventListener('click', limparHistorico);

// Salva no histórico quando o usuário clica fora do display (perde o foco)
display.addEventListener('blur', () => {
    const texto = display.value.trim();
    if (texto) adicionarHistorico(texto, idiomas[idiomaAtual]);
});


/* ------------------------------------------------
   INICIALIZAÇÃO
   Roda quando a página termina de carregar.
   ------------------------------------------------ */
aplicarFonte(0);       // começa no idioma LAT (índice 0)
restaurarRascunho();   // carrega o texto salvo da sessão anterior
renderizarHistorico(); // carrega o histórico do localStorage
syncBotoes();          // sincroniza estado dos botões

// Mensagem no console do navegador (F12) para confirmar que carregou
console.info('%c⚔ Soulframe Keyboard v2.0 %c— loaded', 'color:#d4af37;font-weight:bold;', 'color:#888;');
