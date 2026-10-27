# Cenários de teste

Roteiro dos 13 cenários de teste definidos no enunciado do projeto, executados no navegador com a API real da Open-Meteo.

Marque cada teste com `[x]` depois de executá-lo e confirmar o resultado esperado.

**Navegador utilizado:** _______________  **Data dos testes:** ___/___/______

## Pesquisa de cidades

- [ ] **Teste 1 – Pesquisa válida**
  - **Como testar:** pesquise `Porto Alegre`.
  - **Resultado esperado:** a lista de localidades aparece com estado, país e coordenadas, e é possível clicar na cidade desejada.

- [ ] **Teste 2 – Localidades com nomes semelhantes**
  - **Como testar:** pesquise `Santa Maria`.
  - **Resultado esperado:** aparecem várias localidades, diferenciadas por estado, país e coordenadas. A cidade escolhida é a que aparece no painel do tempo.

- [ ] **Teste 3 – Pesquisa vazia**
  - **Como testar:** clique em "Buscar" com o campo vazio e, depois, digitando apenas espaços.
  - **Resultado esperado:** aparece a mensagem "Digite o nome de uma cidade para pesquisar." e nenhuma requisição é feita (confira na aba Network do DevTools).

- [ ] **Teste 4 – Cidade não encontrada**
  - **Como testar:** pesquise `xyzxyzxyz`.
  - **Resultado esperado:** aparece a mensagem de nenhuma localidade encontrada e a lista de resultados fica vazia. Nenhum dado meteorológico novo é exibido.

## Consulta meteorológica

- [ ] **Teste 5 – Consulta meteorológica**
  - **Como testar:** selecione uma cidade válida.
  - **Resultado esperado:** o painel mostra cidade, país, temperatura, descrição do tempo, sensação térmica, umidade e vento, com unidades. A previsão mostra 5 cartões com data, descrição, mínima, máxima e chance de chuva.

- [ ] **Teste 6 – Nova pesquisa**
  - **Como testar:** depois de consultar uma cidade, pesquise e selecione outra.
  - **Resultado esperado:** o painel e a previsão são substituídos, e o nome exibido é o da nova cidade.

- [ ] **Teste 7 – Carregamento**
  - **Como testar:** no DevTools, aba Network, escolha a limitação **Slow 4G** (ou "3G") e faça uma pesquisa e uma consulta.
  - **Resultado esperado:** a mensagem de carregamento com o indicador giratório aparece e desaparece quando a operação termina.

- [ ] **Teste 8 – Falha de comunicação**
  - **Como testar:** no DevTools, aba Network, marque **Offline**. Faça uma pesquisa e, com resultados já na tela, clique numa cidade. Depois desmarque **Offline** e tente de novo.
  - **Resultado esperado:** aparecem as mensagens "Erro ao localizar a cidade" e "Erro ao consultar a previsão". O botão "Buscar" volta a funcionar e a nova tentativa dá certo.

## Favoritos

- [ ] **Teste 9 – Adicionar favorito**
  - **Como testar:** consulte uma cidade e clique em "Adicionar aos favoritos".
  - **Resultado esperado:** a cidade aparece na lista de favoritas e na chave `consulta-tempo:favoritos` do Local Storage (DevTools → Application). O botão muda para "Nos favoritos" e não permite adicionar de novo.

- [ ] **Teste 10 – Persistência**
  - **Como testar:** adicione duas ou três cidades e atualize a página (F5).
  - **Resultado esperado:** as favoritas continuam na lista.

- [ ] **Teste 11 – Remover favorito**
  - **Como testar:** clique em "Remover" numa das favoritas.
  - **Resultado esperado:** a cidade some da lista e da chave no Local Storage.

- [ ] **Teste 12 – Reutilizar um favorito**
  - **Como testar:** clique numa cidade da lista de favoritas.
  - **Resultado esperado:** o tempo da cidade é consultado direto, sem nova pesquisa por nome. Na aba Network aparece apenas a requisição para `api.open-meteo.com/v1/forecast` com a latitude e a longitude salvas.

## Dados ausentes

- [ ] **Teste 13 – Dados ausentes**
  - **Como testar:** a API normalmente envia todos os campos, então o teste é feito simulando a ausência. Abra o `js/script.js` e, em `consultarClima`, apague `relative_humidity_2m` da linha `current` e `precipitation_probability_max` da linha `daily`. Salve, recarregue a página e consulte uma cidade. Depois desfaça a alteração.
  - **Resultado esperado:** a aplicação continua funcionando e mostra "Não informado" na umidade e na chance de chuva.
  - **Teste extra:** no Local Storage, troque o valor de `consulta-tempo:favoritos` por um texto qualquer e atualize a página. A aplicação abre normalmente, com a lista de favoritas vazia.
