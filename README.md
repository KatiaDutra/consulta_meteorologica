Consulta do Tempo

Aplicação web de consulta meteorológica 
Formação desenvolvida como projeto do Curso de Desenvolvimento Front-end do Programa de Residência – Bolsa Futuro Digital (Instituto Hardware BR, Softex, MCTI, IFRS e IFSul – Câmpus Charqueadas).

A aplicação permite pesquisar cidades, consultar as condições ambientais atuais e a previsão para os próximos cinco dias, além de manter uma lista de cidades favoritas salvas no próprio navegador.

Funcionalidades
Pesquisa de cidades pelo nome, com lista de resultados para escolher a localidade correta (cidade, estado e país)
Painel com as condições atuais: temperatura, sensação térmica, descrição do tempo, vento e umidade relativa do ar
Previsão para os próximos 5 dias: dados, descrição do tempo, temperaturas mínima e máxima e probabilidade de chuva
Lista de cidades favoritas, com inclusão, remoção e consulta rápida
Favoritos salvos no localStorage, mantidos ao atualizar a página
Mensagens de estado na interface: aguardando pesquisa, carregando, sucesso, nenhum resultado e erros
Tecnologias
HTML5
CSS3 (variáveis ​​CSS, Grid e Flexbox, layout responsivo)
JavaScript puro (sem frameworks)
fetch()com Promessas
Manipulação do DOM
localStorage
API utilizada

Os dados vêm da API pública e gratuita Open-Meteo , que não exige chave de acesso. A consulta acontece em duas etapas dependentes:

Geocodificação – uma API de geocodificação recebe o nome da cidade e distribui as localidades localizadas com suas coordenadas.
Previsão – uma API de Previsão obtém a latitude e a longitude da cidade selecionada e devolve as condições atuais e a previsão diária.

A descrição do tempo é gerada a partir dos códigos WMO retornados pela API.

Estrutura do projeto
sistema/
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js

Em Andamento

O projeto está sendo desenvolvido em etapas:

Etapa 1 – Estrutura HTML e CSS base
Etapa 2 – Pesquisa de cidades (geocodificação)
Etapa 3 – Condições atuais e previsão de 5 dias
Etapa 4 – Cidades favoritas comlocalStorage
Etapa 5 – Revisão e cenários de teste
Créditos

Dados meteorológicos fornecidos por Open-Meteo.com , sob licença CC BY 4.0 .

Autora

Katia Dutra – github.com/KatiaDutra
