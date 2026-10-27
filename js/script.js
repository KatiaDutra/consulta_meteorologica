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

// Última lista de localidades encontradas na pesquisa
let ultimosResultados = [];

// Conta as consultas de clima para ignorar respostas antigas
// (ex.: o usuário clicou em outra cidade antes da primeira responder)
let numeroConsultaAtual = 0;

// Cidade cujos dados estão aparecendo no painel (null = nenhuma)
let cidadeExibida = null;

// Chave usada no localStorage e lista de favoritos em memória
const CHAVE_FAVORITOS = 'consulta-tempo:favoritos';
let favoritos = [];

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

			// Só aproveita localidades que vieram com coordenadas válidas,
			// pois sem elas não é possível consultar o tempo
			const locais = resultados
				.filter(function (resultado) {
					return typeof resultado.latitude === 'number'
						&& typeof resultado.longitude === 'number';
				})
				.map(criarLocal);

			exibirResultados(locais);

			if (locais.length === 0) {
				atualizarMensagem(`Nenhuma localidade encontrada para "${nome}". Confira a grafia e tente novamente.`, 'info');
			} else {
				atualizarMensagem(`${locais.length} localidade(s) encontrada(s). Selecione a cidade desejada.`, 'sucesso');
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

// Cria o botão de uma localidade (nome, região e coordenadas)
function criarBotaoLocal(local, selecionado) {
	const botao = document.createElement('button');
	botao.type = 'button';
	botao.className = 'resultado';
	botao.setAttribute('aria-pressed', selecionado ? 'true' : 'false');

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
		selecionarCidade(local, true);
	});

	return botao;
}

// Cria a lista completa de localidades na tela
function exibirResultados(locais) {
	ultimosResultados = locais; // guarda para poder mostrar a lista de novo

	if (locais.length === 0) {
		mostrarVazio(areaResultados, 'Nenhuma localidade encontrada.');
		return;
	}

	const lista = document.createElement('ul');
	lista.className = 'lista-resultados';

	locais.forEach(function (local) {
		const selecionado = cidadeSelecionada !== null && mesmoLocal(local, cidadeSelecionada);
		const item = document.createElement('li');
		item.appendChild(criarBotaoLocal(local, selecionado));
		lista.appendChild(item);
	});

	areaResultados.replaceChildren(lista);
}

// Depois da escolha, mostra só a localidade selecionada e um link
// para voltar à lista, caso o usuário queira trocar
function mostrarApenasSelecionada(local) {
	const lista = document.createElement('ul');
	lista.className = 'lista-resultados';
	const item = document.createElement('li');
	const botaoEscolhido = criarBotaoLocal(local, true);
	item.appendChild(botaoEscolhido);
	lista.appendChild(item);
	areaResultados.replaceChildren(lista);

	const outras = ultimosResultados.length - 1;
	if (outras > 0) {
		const botaoOutras = document.createElement('button');
		botaoOutras.type = 'button';
		botaoOutras.className = 'botao-link';
		botaoOutras.textContent = outras === 1
			? 'Ver a outra localidade encontrada'
			: `Ver as outras ${outras} localidades encontradas`;

		botaoOutras.addEventListener('click', function () {
			exibirResultados(ultimosResultados);
			// Leva o foco do teclado para a localidade que estava escolhida
			const marcado = areaResultados.querySelector('.resultado[aria-pressed="true"]');
			if (marcado) {
				marcado.focus();
			}
		});

		areaResultados.appendChild(botaoOutras);
	}

	// O botão clicado foi recriado; o foco vai para o novo,
	// sem rolar a tela (a rolagem é feita por levarAoPainel)
	botaoEscolhido.focus({ preventScroll: true });
}

// No celular, rola a tela até o painel do tempo
function levarAoPainel() {
	// No computador o painel já fica visível, ao lado dos resultados
	if (!window.matchMedia('(max-width: 799px)').matches) {
		return;
	}
	const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	document.getElementById('area-atual').scrollIntoView({
		behavior: reduzirMovimento ? 'auto' : 'smooth',
		block: 'start'
	});
}

// Registra a localidade escolhida e inicia a consulta do tempo.
// veioDaPesquisa: true quando o clique foi na lista de resultados,
// false quando foi na lista de favoritos
function selecionarCidade(local, veioDaPesquisa) {
	cidadeSelecionada = local;

	if (veioDaPesquisa) {
		mostrarApenasSelecionada(local);
	} else {
		// Escolha pelos favoritos: só tira o destaque dos resultados
		areaResultados.querySelectorAll('.resultado').forEach(function (botao) {
			botao.setAttribute('aria-pressed', 'false');
		});
	}

	// A segunda requisição só acontece aqui, depois que a primeira
	// (geocodificação) já forneceu as coordenadas da cidade
	consultarClima(local);
	levarAoPainel();
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

// Agrupa os códigos WMO em "climas" para escolher cor e ícone.
// ehDia: false quando já é noite na cidade (campo is_day da API)
function classificarTempo(codigo, ehDia) {
	if (codigo === null || codigo === undefined) {
		return { grupo: null, icone: '🌡️' };
	}
	if (codigo <= 1) {
		return ehDia ? { grupo: 'sol', icone: codigo === 0 ? '☀️' : '🌤️' } : { grupo: 'noite', icone: '🌙' };
	}
	if (codigo <= 3) {
		return ehDia ? { grupo: 'nuvens', icone: codigo === 2 ? '⛅' : '☁️' } : { grupo: 'noite', icone: '☁️' };
	}
	if (codigo === 45 || codigo === 48) {
		return { grupo: 'nevoeiro', icone: '🌫️' };
	}
	if (codigo >= 51 && codigo <= 57) {
		return { grupo: 'chuva', icone: '🌦️' };
	}
	if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) {
		return { grupo: 'chuva', icone: '🌧️' };
	}
	if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) {
		return { grupo: 'neve', icone: '❄️' };
	}
	if (codigo >= 95) {
		return { grupo: 'tempestade', icone: '⛈️' };
	}
	return { grupo: null, icone: '🌡️' };
}

// Troca a cor do painel "Tempo agora" (null volta ao visual padrão)
function aplicarTema(grupo) {
	const painel = document.getElementById('area-atual');
	painel.className = 'area area--destaque';
	if (grupo) {
		painel.classList.add(`tema-${grupo}`);
	}
}

// Cria o ícone do tempo; aria-hidden evita que leitores de tela
// leiam o emoji, já que a descrição em texto aparece ao lado
function criarIcone(icone, classe) {
	const span = document.createElement('span');
	span.className = classe;
	span.setAttribute('aria-hidden', 'true');
	span.textContent = icone;
	return span;
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
		current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
		daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
		timezone: 'auto', // datas e horários no fuso da cidade
		forecast_days: 5
	});

	// Remove os dados da cidade anterior antes de mostrar os novos
	cidadeExibida = null;
	aplicarTema(null);
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

	// Botão de favorito, associado à cidade exibida no painel
	const botaoFavorito = document.createElement('button');
	botaoFavorito.type = 'button';
	botaoFavorito.id = 'botao-favorito';
	botaoFavorito.className = 'botao-favorito';
	botaoFavorito.addEventListener('click', function () {
		adicionarFavorito(local);
	});

	// Linha do topo: nome e região à esquerda, botão à direita
	const identificacao = document.createElement('div');
	identificacao.append(cidade, regiao);
	const topo = document.createElement('div');
	topo.className = 'atual__topo';
	topo.append(identificacao, botaoFavorito);

	// Temperatura com o ícone ao lado
	const clima = classificarTempo(atual.weather_code, atual.is_day !== 0);
	const principal = document.createElement('div');
	principal.className = 'atual__principal';
	principal.append(temperatura, criarIcone(clima.icone, 'atual__icone'));

	painel.append(topo, principal, condicao, detalhes);
	aplicarTema(clima.grupo);

	// Horário da medição, no fuso da cidade (ex.: "2026-10-27T14:15")
	if (typeof atual.time === 'string' && atual.time.includes('T')) {
		const horario = document.createElement('p');
		horario.className = 'atual__horario';
		horario.textContent = `Medição das ${atual.time.split('T')[1]} (horário local)`;
		painel.appendChild(horario);
	}

	areaTempoAtual.replaceChildren(painel);

	cidadeExibida = local;
	atualizarBotaoFavorito();
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
		const codigoDoDia = valorDoDia(diario.weather_code, i);
		const climaDoDia = classificarTempo(codigoDoDia, true);

		cartao.className = 'dia';
		if (climaDoDia.grupo) {
			cartao.classList.add(`dia--${climaDoDia.grupo}`);
		}

		const titulo = document.createElement('h3');
		titulo.className = 'dia__data';
		titulo.textContent = formatarData(data);

		const condicao = document.createElement('p');
		condicao.className = 'dia__condicao';
		condicao.append(
			criarIcone(climaDoDia.icone, 'dia__icone'),
			document.createTextNode(descreverCodigo(codigoDoDia))
		);

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

// =========================================================
// Etapa 4 – Cidades favoritas (localStorage)
// =========================================================

// Verifica se um item lido do localStorage tem o formato esperado
function localValido(item) {
	return item !== null
		&& typeof item === 'object'
		&& typeof item.nome === 'string'
		&& typeof item.latitude === 'number'
		&& typeof item.longitude === 'number';
}

// Duas localidades são a mesma quando têm o mesmo id e as mesmas coordenadas
function mesmoLocal(a, b) {
	return a.id === b.id
		&& a.latitude === b.latitude
		&& a.longitude === b.longitude;
}

function ehFavorito(local) {
	return favoritos.some(function (favorito) {
		return mesmoLocal(favorito, local);
	});
}

// Lê os favoritos salvos; se não houver ou estiverem inválidos, começa vazio
function carregarFavoritos() {
	try {
		const texto = localStorage.getItem(CHAVE_FAVORITOS);
		if (texto === null) {
			return []; // primeira vez: nada salvo ainda
		}

		const dados = JSON.parse(texto); // pode lançar erro se o texto estiver corrompido
		if (!Array.isArray(dados)) {
			throw new Error('Favoritos salvos em formato inválido');
		}

		// Descarta itens que não tenham os dados mínimos
		return dados.filter(localValido);
	} catch (erro) {
		console.warn('Favoritos salvos foram ignorados:', erro);
		return [];
	}
}

// Grava a lista atual no localStorage
function salvarFavoritos() {
	try {
		localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
		return true;
	} catch (erro) {
		// Ex.: navegador com armazenamento bloqueado ou cheio
		console.error(erro);
		atualizarMensagem('Não foi possível salvar os favoritos neste navegador.', 'erro');
		return false;
	}
}

function adicionarFavorito(local) {
	if (ehFavorito(local)) {
		atualizarMensagem(`${local.nome} já está nos favoritos.`, 'info');
		return;
	}

	favoritos.push({ ...local }); // guarda uma cópia do objeto
	exibirFavoritos();
	atualizarBotaoFavorito();

	if (salvarFavoritos()) {
		atualizarMensagem(`${local.nome} foi adicionada aos favoritos.`, 'sucesso');
	}
}

function removerFavorito(local) {
	favoritos = favoritos.filter(function (favorito) {
		return !mesmoLocal(favorito, local);
	});
	exibirFavoritos();
	atualizarBotaoFavorito();

	if (salvarFavoritos()) {
		atualizarMensagem(`${local.nome} foi removida dos favoritos.`, 'info');
	}
}

// Ajusta o botão do painel conforme a cidade exibida já ser favorita ou não
function atualizarBotaoFavorito() {
	const botao = document.getElementById('botao-favorito');
	if (!botao || !cidadeExibida) {
		return;
	}

	const jaFavorita = ehFavorito(cidadeExibida);
	botao.disabled = jaFavorita;
	botao.textContent = jaFavorita ? '★ Nos favoritos' : '☆ Adicionar aos favoritos';
}

// Desenha a lista de favoritos na tela
function exibirFavoritos() {
	if (favoritos.length === 0) {
		mostrarVazio(areaFavoritos, 'Nenhuma cidade favorita ainda. Consulte uma cidade e use o botão "Adicionar aos favoritos".');
		return;
	}

	const lista = document.createElement('ul');
	lista.className = 'lista-favoritos';

	favoritos.forEach(function (local) {
		const item = document.createElement('li');
		item.className = 'favorito';

		// Botão principal: consulta o tempo da cidade favorita
		const botaoConsultar = document.createElement('button');
		botaoConsultar.type = 'button';
		botaoConsultar.className = 'resultado favorito__consultar';

		const nome = document.createElement('span');
		nome.className = 'resultado__nome';
		nome.textContent = local.nome;

		const detalhes = document.createElement('span');
		detalhes.className = 'resultado__detalhes';
		detalhes.textContent = descreverLocal(local) || 'Região não informada';

		botaoConsultar.append(nome, detalhes);
		botaoConsultar.addEventListener('click', function () {
			// Usa as coordenadas salvas, sem pesquisar o nome de novo
			selecionarCidade(local, false);
		});

		const botaoRemover = document.createElement('button');
		botaoRemover.type = 'button';
		botaoRemover.className = 'favorito__remover';
		botaoRemover.textContent = 'Remover';
		botaoRemover.setAttribute('aria-label', `Remover ${local.nome} dos favoritos`);
		botaoRemover.addEventListener('click', function () {
			removerFavorito(local);
		});

		item.append(botaoConsultar, botaoRemover);
		lista.appendChild(item);
	});

	areaFavoritos.replaceChildren(lista);
}

// =========================================================
// Inicialização: recupera os favoritos ao abrir a página
// =========================================================
favoritos = carregarFavoritos();
exibirFavoritos();
