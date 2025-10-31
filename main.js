const display = document.getElementById('display');
const teclas = document.querySelectorAll('.tecla[data-key]');
const ptSf = document.getElementById('pt-sf');
const limpar = document.getElementById('limpar');
const espaco = document.getElementById('espaco');
const titulo = document.getElementById('titulo');

let sfAtivo = false;

// Alternar modo SFS/LAT na qual SFS = Soulframe Script e LAT = Latin Script
ptSf.addEventListener('click', () => {
    sfAtivo = !sfAtivo;

    // Alterna a fonte da textarea
    display.classList.toggle('sf-ativo', sfAtivo);

    // Alterna fonte das teclas (exceto LTS/SFS e Limpar)
    teclas.forEach(tecla => {
        tecla.classList.toggle('sf-ativo', sfAtivo);
    });

    // Alterna fonte da tecla espaço
    espaco.classList.toggle('sf-ativo', sfAtivo);

    // Alterna fonte do título
    titulo.classList.toggle('sf-ativo', sfAtivo);

    // Atualiza o texto do botão
    ptSf.textContent = sfAtivo ? "LAT" : "ODE";
});

// Limpar display
limpar.addEventListener('click', () => display.value = "");

// Digitação pelo teclado virtual
teclas.forEach(tecla => {
    tecla.addEventListener('click', () => {
        const letra = tecla.dataset.key;
        if (!letra) return;
        display.value += letra;
    });
});

// Digitação pelo botão espaço
espaco.addEventListener('click', () => {
    display.value += " ";
});

// Digitação pelo teclado físico
document.addEventListener('keydown', e => {
    if (e.key === "Backspace") {
        display.value = display.value.slice(0, -1);
    } else if (e.key === " ") {
        display.value += " ";
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        display.value += e.key.toUpperCase();
    }
});
