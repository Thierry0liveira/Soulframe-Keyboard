const display = document.getElementById('display');
const teclas = document.querySelectorAll('.tecla[data-key]');
const ptSf = document.getElementById('pt-sf');
const limpar = document.getElementById('limpar');
const espaco = document.getElementById('espaco');
const titulo = document.getElementById('titulo');

// LISTA DOS IDIOMAS
const idiomas = ["LAT", "ODE", "ROSE"]; // começa no LAT

// O primeiro idioma é o atual
let idiomaAtual = 0;

// Aplica a fonte de acordo com o idioma
function aplicarFonte(id) {
    const idioma = idiomas[id];

    const fonteSoulframe = idioma === "ODE";
    const fonteNova = idioma === "ROSE";

    display.classList.remove("sf-ativo", "novo-ativo");
    titulo.classList.remove("sf-ativo", "novo-ativo");
    espaco.classList.remove("sf-ativo", "novo-ativo");
    teclas.forEach(t => t.classList.remove("sf-ativo", "novo-ativo"));

    if (fonteSoulframe) {
        display.classList.add("sf-ativo");
        titulo.classList.add("sf-ativo");
        espaco.classList.add("sf-ativo");
        teclas.forEach(t => t.classList.add("sf-ativo"));
    }

    if (fonteNova) {
        display.classList.add("novo-ativo");
        titulo.classList.add("novo-ativo");
        espaco.classList.add("novo-ativo");
        teclas.forEach(t => t.classList.add("novo-ativo"));
    }
}

// Alternar idioma
ptSf.addEventListener('click', () => {
    idiomaAtual = (idiomaAtual + 1) % idiomas.length;

    // MOSTRAR O PRÓXIMO IDIOMA, NÃO O ATUAL
    const proximo = idiomas[(idiomaAtual + 1) % idiomas.length];
    ptSf.textContent = proximo;

    aplicarFonte(idiomaAtual);
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

// Espaço
espaco.addEventListener('click', () => {
    display.value += " ";
});

// Teclado físico
document.addEventListener('keydown', e => {
    if (e.key === "Backspace") {
        e.preventDefault();
        display.value = display.value.slice(0, -1);
        return;
    }
    if (e.key === " ") {
        e.preventDefault();
        display.value += " ";
        return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        display.value += e.key.toUpperCase();
        return;
    }
});
