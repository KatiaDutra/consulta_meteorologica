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

// Endereços das APIs da Open-Meteo
const URL_GEOCODIFICACAO = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_PREVISAO = 'https://api.open-meteo.com/v1/forecast';

// Guarda a localidade escolhida pelo usuário (null = nenhuma ainda)
let cidadeSelecionada = null;

// Conta as consultas de clima para ignorar respostas antigas
// (ex.: o usuário clicou em outra cidade antes da primeira responder)
let numeroConsultaAtual = 0;

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

	// A segunda requisição só acontece aqui, depois que a primeira
	// (geocodificação) já forneceu as coordenadas da cidade
	consultarClima(local);
}

// =========================================================
// Etapa 3 – Consulta das condições atuais e da previsão
// =========================================================

// Tabela de códigos meteorológicos WMO (documentação da Open-Meteo)
const CODIGOS_TEMPO = {
	0: 'Céu limpo',
	1: 'Predominantemente limpo',
	2: 'Parcialmente nublado',
	3: 'Nublado',
	45: 'Nevoeiro',
	48: 'Nevoeiro com geada',
	51: 'Garoa fraca',
	53: 'Garoa moderada',
	55: 'Garoa intensa',
	56: 'Garoa congelante fraca',
	57: 'Garoa congelante intensa',
	61: 'Chuva fraca',
	63: 'Chuva moderada',
	65: 'Chuva forte',
	66: 'Chuva congelante fraca',
	67: 'Chuva congelante forte',
	71: 'Neve fraca',
	73: 'Neve moderada',
	75: 'Neve forte',
	77: 'Grãos de neve',
	80: 'Pancadas de chuva fracas',
	81: 'Pancadas de chuva moderadas',
	82: 'Pancadas de chuva violentas',
	85: 'Pancadas de neve fracas',
	86: 'Pancadas de neve fortes',
	95: 'Trovoada',
	96: 'Trovoada com granizo fraco',
	99: 'Trovoada com granizo forte'
};

// Converte o código numérico em uma descrição legível
function descreverCodigo(codigo) {
	if (codigo === null || codigo === undefined) {
		return 'Condição não informada';
	}
	return CODIGOS_TEMPO[codigo] || `Condição desconhecida (código ${codigo})`;
}

// Formata um número com unidade; se o valor não veio da API, avisa
function formatarValor(valor, unidade) {
	if (typeof valor !== 'number' || Number.isNaN(valor)) {
		return 'Não informado';
	}
	const numero = Math.round(valor).toLocaleString('pt-BR');
	return unidade ? `${numero} ${unidade}` : numero;
}

// Converte "2026-10-27" em "Hoje, 27/10" ou "Qua., 28/10"
function formatarData(textoData) {
	// Montamos a data com ano, mês e dia para evitar o fuso UTC,
	// que faria a data aparecer um dia antes no Brasil
	const [ano, mes, dia] = textoData.split('-').map(Number);
	const data = new Date(ano, mes - 1, dia);
	const diaMes = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

	const hoje = new Date();
	if (data.toDateString() === hoje.toDateString()) {
		return `Hoje, ${diaMes}`;
	}

	const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
	return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${diaMes}`;
}

// Faz a segunda requisição, usando as coordenadas da cidade selecionada
function consultarClima(local) {
	numeroConsultaAtual++;
	const estaConsulta = numeroConsultaAtual;

	const parametros = new URLSearchParams({
		latitude: local.latitude,
		longitude: local.longitude,
		current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
		daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
		timezone: 'auto', // datas e horários no fuso da cidade
		forecast_days: 5
	});

	// Remove os dados da cidade anterior antes de mostrar os novos
	mostrarVazio(areaTempoAtual, `Carregando o tempo em ${local.nome}...`);
	mostrarVazio(areaPrevisao, 'Carregando a previsão...');
	atualizarMensagem(`Carregando as condições meteorológicas de ${local.nome}...`, 'carregando');

	fetch(`${URL_PREVISAO}?${parametros}`)
		.then(function (resposta) {
			if (!resposta.ok) {
				throw new Error(`Erro HTTP ${resposta.status}`);
			}
			return resposta.json();
		})
		.then(function (dados) {
			// Se outra cidade foi selecionada nesse meio-tempo, ignora esta resposta
			if (estaConsulta !== numeroConsultaAtual) {
				return;
			}

			if (!dados.current || !dados.daily || !Array.isArray(dados.daily.time)) {
				throw new Error('Resposta inesperada da API de previsão');
			}

			exibirTempoAtual(local, dados.current, dados.current_units || {});
			exibirPrevisao(dados.daily, dados.daily_units || {});
			atualizarMensagem(`Tempo atualizado para ${local.nome}.`, 'sucesso');
		})
		.catch(function (erro) {
			if (estaConsulta !== numeroConsultaAtual) {
				return;
			}
			console.error(erro);
			// Não deixa dados antigos na tela, para não confundir as cidades
			mostrarVazio(areaTempoAtual, `Não foi possível carregar o tempo em ${local.nome}.`);
			mostrarVazio(areaPrevisao, 'Previsão indisponível.');
			atualizarMensagem('Erro ao consultar a previsão. Clique na cidade novamente para tentar outra vez.', 'erro');
		});
}

// Cria um par "rótulo: valor" dentro de uma lista de definições (<dl>)
function criarDetalhe(rotulo, valor) {
	const grupo = document.createElement('div');
	const termo = document.createElement('dt');
	const definicao = document.createElement('dd');
	termo.textContent = rotulo;
	definicao.textContent = valor;
	grupo.append(termo, definicao);
	return grupo;
}

// Monta o painel com as condições atuais
function exibirTempoAtual(local, atual, unidades) {
	const painel = document.createElement('div');
	painel.className = 'atual';

	const cidade = document.createElement('h3');
	cidade.className = 'atual__cidade';
	cidade.textContent = local.nome;

	const regiao = document.createElement('p');
	regiao.className = 'atual__regiao';
	regiao.textContent = descreverLocal(local) || 'Região não informada';

	const temperatura = document.createElement('p');
	temperatura.className = 'atual__temperatura';
	temperatura.textContent = formatarValor(atual.temperature_2m, unidades.temperature_2m);

	const condicao = document.createElement('p');
	condicao.className = 'atual__condicao';
	condicao.textContent = descreverCodigo(atual.weather_code);

	const detalhes = document.createElement('dl');
	detalhes.className = 'atual__detalhes';
	detalhes.append(
		criarDetalhe('Sensação térmica', formatarValor(atual.apparent_temperature, unidades.apparent_temperature)),
		criarDetalhe('Umidade relativa', formatarValor(atual.relative_humidity_2m, unidades.relative_humidity_2m)),
		criarDetalhe('Vento', formatarValor(atual.wind_speed_10m, unidades.wind_speed_10m))
	);

	painel.append(cidade, regiao, temperatura, condicao, detalhes);

	// Horário da medição, no fuso da cidade (ex.: "2026-10-27T14:15")
	if (typeof atual.time === 'string' && atual.time.includes('T')) {
		const horario = document.createElement('p');
		horario.className = 'atual__horario';
		horario.textContent = `Medição das ${atual.time.split('T')[1]} (horário local)`;
		painel.appendChild(horario);
	}

	areaTempoAtual.replaceChildren(painel);
}

// Monta os cartões da previsão diária
function exibirPrevisao(diario, unidades) {
	// Pega o valor da posição "i" de uma lista, ou null se a lista não existir
	function valorDoDia(lista, i) {
		return Array.isArray(lista) ? lista[i] : null;
	}

	if (diario.time.length === 0) {
		mostrarVazio(areaPrevisao, 'A API não retornou dias de previsão.');
		return;
	}

	const lista = document.createElement('ul');
	lista.className = 'lista-previsao';

	diario.time.slice(0, 5).forEach(function (data, i) {
		const cartao = document.createElement('li');
		cartao.className = 'dia';

		const titulo = document.createElement('h3');
		titulo.className = 'dia__data';
		titulo.textContent = formatarData(data);

		const condicao = document.createElement('p');
		condicao.className = 'dia__condicao';
		condicao.textContent = descreverCodigo(valorDoDia(diario.weather_code, i));

		const detalhes = document.createElement('dl');
		detalhes.className = 'dia__detalhes';
		detalhes.append(
			criarDetalhe('Mín.', formatarValor(valorDoDia(diario.temperature_2m_min, i), unidades.temperature_2m_min)),
			criarDetalhe('Máx.', formatarValor(valorDoDia(diario.temperature_2m_max, i), unidades.temperature_2m_max)),
			criarDetalhe('Chuva', formatarValor(valorDoDia(diario.precipitation_probability_max, i), unidades.precipitation_probability_max))
		);

		cartao.append(titulo, condicao, detalhes);
		lista.appendChild(cartao);
	});

	areaPrevisao.replaceChildren(lista);
}
