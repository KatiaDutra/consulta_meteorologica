# Consulta do Tempo

Aplicação web de consulta meteorológica desenvolvida como projeto do **Curso de Desenvolvimento Front-end** do **Programa de Formação Acelerada – Bolsa Futuro Digital** (Instituto Hardware BR, Softex, MCTI, IFRS e IFSul – Câmpus Charqueadas).

A aplicação permite pesquisar cidades, consultar as condições meteorológicas atuais e a previsão para os próximos cinco dias, além de manter uma lista de cidades favoritas salva no próprio navegador.

## Funcionalidades

- Pesquisa de cidades pelo nome, com lista de resultados para escolher a localidade correta (cidade, estado e país)
- Painel com as condições atuais: temperatura, sensação térmica, descrição do tempo, vento e umidade relativa do ar
- Previsão para os próximos 5 dias: data, descrição do tempo, temperaturas mínima e máxima e probabilidade de chuva
- Lista de cidades favoritas, com inclusão, remoção e consulta rápida
- Favoritos salvos no `localStorage`, mantidos ao atualizar a página
- Mensagens de estado na interface: aguardando pesquisa, carregando, sucesso, nenhum resultado e erros

## Tecnologias

- HTML5
- CSS3 (variáveis CSS, Grid e Flexbox, layout responsivo)
- JavaScript puro (sem frameworks)
  - `fetch()` com Promises
  - Manipulação do DOM
  - `localStorage`

## API utilizada

Os dados vêm da API pública e gratuita [Open-Meteo](https://open-meteo.com/), que não exige chave de acesso. A consulta acontece em duas etapas dependentes:

1. **Geocodificação** – a [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) recebe o nome da cidade e devolve as localidades encontradas com suas coordenadas.
2. **Previsão** – a [Forecast API](https://open-meteo.com/en/docs) recebe a latitude e a longitude da cidade selecionada e devolve as condições atuais e a previsão diária.

A descrição do tempo é gerada a partir dos códigos WMO retornados pela API.

## Estrutura do projeto

```
consulta_meteorologica/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    └── script.js
```

## Como executar

Não é necessário instalar nada.

1. Clone o repositório:
   ```bash
   git clone https://github.com/KatiaDutra/consulta_meteorologica.git
   ```
2. Abra o arquivo `index.html` no navegador.

Também é possível usar a extensão **Live Server** do VS Code para recarregar a página automaticamente durante o desenvolvimento.

## Andamento

O projeto está sendo desenvolvido em etapas:

- [x] Etapa 1 – Estrutura HTML e CSS base
- [x] Etapa 2 – Pesquisa de cidades (geocodificação)
- [x] Etapa 3 – Condições atuais e previsão de 5 dias
- [x] Etapa 4 – Cidades favoritas com `localStorage`
- [ ] Etapa 5 – Revisão e cenários de teste

## Créditos

Dados meteorológicos fornecidos por [Open-Meteo.com](https://open-meteo.com/), sob a licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Autora

**Katia Dutra** – [github.com/KatiaDutra](https://github.com/KatiaDutra)
