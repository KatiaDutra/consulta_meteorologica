
const formBusca = document.getElementById('form-busca');
const campoCidade = document.getElementById('campo-cidade');
const botaoBuscar = document.getElementById('botao-buscar');
const mensagem = document.getElementById('mensagem');
const areaResultados = document.getElementById('resultados');
const areaFavoritos = document.getElementById('favoritos');
const areaTempoAtual = document.getElementById('tempo-atual');
const areaPrevisao = document.getElementById('previsao');

function atualizarMensagem(texto, tipo) {
	mensagem.textContent = texto;
	mensagem.className = `mensagem mensagem--${tipo}`;
}