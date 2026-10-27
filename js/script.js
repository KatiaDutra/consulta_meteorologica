// =========================================================
// Referências aos elementos da página
// =========================================================
const formBusca = document.getElementById('form-busca');
const campoCidade = document.getElementById('campo-cidade');
const botaoBuscar = document.getElementById('botao-buscar');
const mensagem = document.getElementById('mensagem');
const areaResultados = document.getElementById('resultados');
const areaFavoritos = document.getElementById('favoritos');
const areaTempoAtual = document.getElementById('tempo-atual');
const areaPrevisao = document.getElementById('previsao');

// Endereço da API de geocodificação da Open-Meteo
const URL_GEOCODIFICACAO = 'https://geocoding-api.open-meteo.com/v1/search';

// Guarda a localidade escolhida pelo usuário (null = nenhuma ainda)
let cidadeSelecionada = null;

// =========================================================
// Mensagens de estado
// tipo: 'info', 'carregando', 'sucesso' ou 'erro'
// =========================================================
function atualizarMensagem(texto, tipo) {
	mensagem.textContent = texto;
	// Troca a classe de estado, mantendo a classe base "mensagem"
	mensagem.className = `mensagem mensagem--${tipo}`;
}

// =========================================================
// Etapa 2 – Pesquisa de cidades
// =========================================================

// Envio do formulário: valida o campo antes de pesquisar
formBusca.addEventListener('submit', function (evento) {
	evento.preventDefault(); // impede o recarregamento da página

	const nome = campoCidade.value.trim(); // remove espaços do início e do fim

	if (nome === '') {
		atualizarMensagem('Digite o nome de uma cidade para pesquisar.', 'erro');
		campoCidade.focus();
		return; // não faz a requisição
	}

	pesquisarCidades(nome);
});

// Consulta a API de geocodificação com o nome informado
function pesquisarCidades(nome) {
	const parametros = new URLSearchParams({
		name: nome,
		count: 10,
		language: 'pt',
		format: 'json'
	});

	// Limpa resultados antigos e indica o carregamento
	areaResultados.replaceChildren();
	atualizarMensagem(`Procurando localidades para "${nome}"...`, 'carregando');
	botaoBuscar.disabled = true; // evita pesquisas repetidas durante a requisição

	fetch(`${URL_GEOCODIFICACAO}?${parametros}`)
		.then(function (resposta) {
			// fetch() não rejeita em erros HTTP (404, 500...), então verificamos "ok"
			if (!resposta.ok) {
				throw new Error(`Erro HTTP ${resposta.status}`);
			}
			return resposta.json(); // converte o corpo da resposta para objeto
		})
		.then(function (dados) {
			// Quando não encontra nada, a API simplesmente não envia "results"
			const resultados = dados.results || [];

			if (!Array.isArray(resultados)) {
				throw new Error('Resposta inesperada da API de geocodificação');
			}

			exibirResultados(resultados.map(criarLocal));

			if (resultados.length === 0) {
				atualizarMensagem(`Nenhuma localidade encontrada para "${nome}". Confira a grafia e tente novamente.`, 'info');
			} else {
				atualizarMensagem(`${resultados.length} localidade(s) encontrada(s). Selecione a cidade desejada.`, 'sucesso');
			}
		})
		.catch(function (erro) {
			console.error(erro);
			mostrarVazio(areaResultados, 'A pesquisa não pôde ser concluída.');
			atualizarMensagem('Erro ao localizar a cidade. Verifique sua conexão e tente novamente.', 'erro');
		})
		.finally(function () {
			// Executa com sucesso ou erro: libera o botão para nova tentativa
			botaoBuscar.disabled = false;
		});
}

// Converte um resultado da API em um objeto só com o que a aplicação usa
function criarLocal(resultado) {
	return {
		id: resultado.id,
		nome: resultado.name,
		municipio: resultado.admin2, // pode não existir
		estado: resultado.admin1,    // pode não existir
		pais: resultado.country,     // pode não existir
		latitude: resultado.latitude,
		longitude: resultado.longitude
	};
}

// Monta o texto "município, estado, país" ignorando campos ausentes
function descreverLocal(local) {
	// O município só é mostrado quando for diferente do nome da cidade
	const municipio = local.municipio !== local.nome ? local.municipio : null;
	return [municipio, local.estado, local.pais].filter(Boolean).join(', ');
}

// Mostra um texto de "vazio" dentro de uma área
function mostrarVazio(area, texto) {
	const paragrafo = document.createElement('p');
	paragrafo.className = 'vazio';
	paragrafo.textContent = texto;
	area.replaceChildren(paragrafo);
}

// Cria a lista de localidades na tela
function exibirResultados(locais) {
	if (locais.length === 0) {
		mostrarVazio(areaResultados, 'Nenhuma localidade encontrada.');
		return;
	}

	const lista = document.createElement('ul');
	lista.className = 'lista-resultados';

	locais.forEach(function (local) {
		const item = document.createElement('li');

		const botao = document.createElement('button');
		botao.type = 'button';
		botao.className = 'resultado';
		botao.setAttribute('aria-pressed', 'false');

		const nome = document.createElement('span');
		nome.className = 'resultado__nome';
		nome.textContent = local.nome;

		const detalhes = document.createElement('span');
		detalhes.className = 'resultado__detalhes';
		detalhes.textContent = descreverLocal(local) || 'Região não informada';

		// Coordenadas ajudam a diferenciar cidades com o mesmo nome
		const coordenadas = document.createElement('span');
		coordenadas.className = 'resultado__coordenadas';
		coordenadas.textContent = `Lat. ${local.latitude.toFixed(2)}, long. ${local.longitude.toFixed(2)}`;

		botao.append(nome, detalhes, coordenadas);

		botao.addEventListener('click', function () {
			selecionarCidade(local, botao);
		});

		item.appendChild(botao);
		lista.appendChild(item);
	});

	areaResultados.replaceChildren(lista);
}

// Registra a localidade escolhida e destaca o botão clicado
function selecionarCidade(local, botaoClicado) {
	cidadeSelecionada = local;

	// Remove o destaque dos outros resultados
	areaResultados.querySelectorAll('.resultado').forEach(function (botao) {
		botao.setAttribute('aria-pressed', 'false');
	});
	if (botaoClicado) {
		botaoClicado.setAttribute('aria-pressed', 'true');
	}

	atualizarMensagem(`Selecionada: ${local.nome} (${descreverLocal(local)}).`, 'sucesso');

	// Etapa 3: aqui vamos chamar a consulta do tempo usando
	// cidadeSelecionada.latitude e cidadeSelecionada.longitude
}
