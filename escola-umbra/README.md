# Escola Umbra · Reels

Template de vídeos 9:16 (1080x1920, 30 fps, MP4 H.264) da [@escolaumbratcg](https://www.instagram.com/escolaumbratcg).
Você troca um arquivo de roteiro (JSON) e sai uma aula nova, com a capa.

Feito em [Remotion](https://www.remotion.dev) (React + TypeScript). As cartas são as reais, buscadas na [Pokémon TCG API](https://pokemontcg.io).

## Começando

Precisa de Node 22 ou mais novo. Para o narrador, Python 3. O `ffmpeg` só é obrigatório no comando `quadros`.

```bash
cd escola-umbra
npm install
npm run aula -- aulas/aula-01.json
```

Sai em `out/`: `aula-01.mp4` e `aula-01-capa.png`.

## Criar a próxima aula

1. Copie `aulas/aula-01.json` para `aulas/aula-02.json`.
2. Troque `numero`, `titulo_capa`, as cartas e as cenas.
3. Confira antes de renderizar: `npm run validar -- aulas/aula-02.json`
   Mostra qual versão de cada carta foi usada, a duração de cada cena e qualquer regra quebrada.
4. Veja uma prévia rápida: `npm run previa -- aulas/aula-02.json`
5. Renderize a final: `npm run aula -- aulas/aula-02.json`

## Clipes (cortes de vídeo)

Para cortar e editar um vídeo horizontal (por exemplo, um clipe da transmissão de um torneio) no formato da Escola Umbra:

1. Coloque o vídeo em `clipes/brutos/` (essa pasta não vai para o git).
2. Crie um roteiro em `clipes/`, como `clipes/teste.json`:
   - `arquivo`: o vídeo;
   - `trechos`: `{"de", "ate"}` em segundos do vídeo original, na ordem em que entram; `zoom` opcional: `{"em", "x", "y", "escala"}`, com x e y de 0 a 1 no quadro original;
   - `titulo`, `rotulo` (padrão "JOGADA DO LAIC") e `serie`;
   - `legendas` com `em` e `ate` em segundos do clipe;
   - `impactos`: segundos do clipe com flash, tremor e estrondo.
3. `npm run clipe -- clipes/jogada-1.json` gera `out/clipes/jogada-1.mp4`: o vídeo grande no meio, ele mesmo desfocado no fundo, etiqueta, título, legenda, efeitos, o som original e uma tela final com o @.

Imagem de transmissão oficial tem dono: o Instagram pode silenciar ou derrubar o vídeo.

## Série Deck do Dia

Além das aulas, a página tem a série **Deck do Dia**: um deck do meta por episódio. Os roteiros ficam em `decks/` e usam o mesmo motor das aulas, com `"formato": "deck_do_dia"` no roteiro. Isso troca a etiqueta do topo e da capa para `DECK DO DIA #01 // META STANDARD` e liga a edição própria da série (`src/deckdodia/`). Ela não tem o Kai: o vídeo é só cartas em movimento.

- **Gancho:** a carta de `"carta"` voa girando até o centro, bate com tremor, flash e linhas de velocidade, e as outras cartas da capa abrem em leque atrás. O nome do deck bate na tela.
- **Ranking:** a carta entra girando e o número do 1º lugar conta de 0 até o valor; os seguintes entram deslizando.
- **Carta em destaque:** a carta chega inclinada, fica balançando com reflexo holográfico, e o `foco` dá um zoom de câmera no ataque.
- **Lista (`decklist`):** as cartas são distribuídas uma a uma, virando no ar até a grade. Cada destaque sai da grade, gira e cresce no centro.
- **CTA:** carrossel girando com as cartas da capa.
- Legenda grande palavra por palavra (a palavra falada ganha tarja vermelha), corte com zoom e desfoque entre cenas, faíscas no fundo.
- Efeitos sonoros (whoosh, impacto, carta, brilho, subida) sintetizados por `scripts/sfx.sh` em `public/sfx/`, sem direitos de terceiros.

O render leva uns 14 minutos para 40 s.

1. Copie `decks/deck-01.json` para `decks/deck-02.json` e troque `numero`.
2. Escolha o deck em [limitlesstcg.com/decks](https://limitlesstcg.com/decks?format=standard&time=1months) (Standard, último mês) e copie a lista de um resultado recente.
3. Monte as cenas: gancho com o nome do deck (e `"carta"`, a que voa para a tela), ranking do mês, uma ou duas cartas que fazem o deck ganhar, a lista completa (`decklist`) e o CTA.
4. `npm run validar -- decks/deck-02.json` confere que a lista soma 60 cartas e que todas existem na API.
5. `npm run aula -- decks/deck-02.json` gera `out/deck-02.mp4` e a capa.

| Comando | O que faz |
| --- | --- |
| `npm run aula -- <roteiro>` | MP4 final e capa PNG em `out/` |
| `npm run previa -- <roteiro>` | MP4 pequeno e rápido (432x768) para conferir o ritmo |
| `npm run validar -- <roteiro>` | Só confere roteiro, cartas e regras |
| `npm run narrar -- <roteiro>` | Gera só a narração e mostra o tempo de cada frase |
| `npm run narrar -- --amostras` | Grava uma amostra de cada voz em `out/amostras/`, para escolher o narrador |
| `npm run quadros -- <roteiro> --guias` | Fotos dos pontos de transição em `out/quadros/`, com a área segura desenhada |
| `npm run trecho -- <roteiro> 240 390` | Renderiza só os quadros 240 a 390 em `out/quadros/`, para conferir boca e gestos sem esperar o vídeo todo |
| `npm run studio -- <roteiro>` | Abre o Remotion Studio para ver e ajustar ao vivo |
| `npm run capa -- <roteiro>` | Gera só a capa PNG, sem renderizar o vídeo |
| `npm run loja` | Gera as peças da loja em `out/loja/`: banner 3:1 (2400x800), banner 16:9 (1920x1080) e foto de perfil (1080x1080). O texto fica em `src/Loja.tsx` |

Opções úteis de `aula`: `--guias` (área segura por cima), `--sem-capa`, `--atualizar-cartas` (ignora o cache), `--refazer-narracao`, `--forcar` (renderiza mesmo com regra quebrada).

## O roteiro

```json
{
  "serie": "Do zero ao campeonato",
  "numero": 2,
  "titulo_capa": "a mão",
  "subtitulo_capa": "o que fazer com ela",
  "capa": {"cartas": ["dreepy", "drakloak"]},
  "narracao": "auto",
  "musica": "audio/trilha.mp3",
  "cartas": {
    "iron-thorns": {"nome": "Iron Thorns ex", "set": "Twilight Masquerade", "numero": 77},
    "dawn": {"nome": "Dawn"}
  },
  "cenas": []
}
```

- **cartas**: apelidos para usar nas cenas. O nome é em inglês, como na API. Com `set` e `numero` a versão é exata. Só com o nome, o sistema escolhe a versão comum mais recente do Standard atual e avisa qual usou. HP, ataques, custo e dano vêm sempre da API; se faltar algum dado, o comando para e avisa.
- **Standard atual**: marcas de regulamento `H`, `I` e `J`. Na rotação, mude `MARCAS_STANDARD` em `src/tema.ts`.
- **Legenda dinâmica**: toda cena aceita `"legenda": "texto"` ou `"legendas": [{"texto": "...", "em": 1.2}]`. A palavra entre asteriscos fica dourada: `"Liga *uma* energia"`.
- **Tempo**: `duracao` em segundos em cada cena. Para casar com a narração, ponha `inicio` (segundo do vídeo) em cada cena.
- **Sem emojis**: o validador recusa.

### Tipos de cena

| `tipo` | Campos |
| --- | --- |
| `gancho` | `texto` (a palavra gigante), `subtitulo` |
| `carta_destaque` | `carta`, `pill` ("META", "DE VOLTA"), `pill_cor` (`ouro` ou `vermelho`), `titulo`, `foco` (zoom num ponto da carta: `{"em": 2.2, "x": 0.33, "y": 0.87, "escala": 2.4}`, com x e y de 0 a 1; 0.87 de altura é a linha de fraqueza e resistência) |
| `lista` | `titulo`, `itens` (texto, ou `{"texto", "detalhe", "em", "destaque", "carta"}`; com `destaque` o item não apaga quando o próximo entra, e com `carta` aparece a miniatura da carta no lugar do número) |
| `piramide` | `titulo`, `modo` (`piramide` ou `ranking`), `fonte` (linha pequena citando a origem dos dados), `niveis` da base ao topo: `{"rotulo", "detalhe", "destaque"}`. No `ranking`, cada nível aceita também `carta` (miniatura) e `valor` (preenche a barra na proporção), e o `detalhe` aparece grande à direita |
| `comparacao` | `titulo`, `pill_bons`, `pill_ruins`, `bons` e `ruins` (cartas ou `{"texto"}`) |
| `riscado` | `titulo`, `itens` (texto, ou `{"texto", "em", "riscar_em"}`) |
| `mesa` | `estado` e `acoes` (abaixo) |
| `decklist` | `titulo`, `cartas` (a lista do deck: `{"carta", "qtd"}`, somando 60), `destaques` (`{"carta", "em"}`: a carta salta e o resto escurece; sem `em`, cada destaque acende junto com uma das últimas frases da cena) |
| `cta` | `principal`, `complemento`, `seguir` |

Exemplos de todas: `aulas/demo-componentes.json` e `aulas/demo-mesa.json`. A `aulas/aula-02.json` mostra o ranking com dados de torneio. A `aulas/aula-03.json` mostra a lista com miniaturas de carta.

### Mesa simulada

`estado` descreve a mesa quando a cena começa:

```json
"estado": {
  "turno": 3,
  "quem_comecou": "eu",
  "eu": {
    "ativo": {"carta": "dreepy", "energias": ["energia-psiquica"], "entrou_no_turno": 1},
    "banco": [{"carta": "drakloak", "evoluiu_de": ["dreepy"]}],
    "mao": ["dawn", "energia-fogo"],
    "deck": 45,
    "premios": 6
  },
  "oponente": {"ativo": {"carta": "iron-thorns"}, "mao": 6, "deck": 45, "premios": 6}
}
```

`acoes` é a lista do que acontece. Cada ação aceita `legenda`, `em` (segundo dentro da cena) e `duracao`; sem `em`, uma vem depois da outra. Alvos: `"ativo"`, `"banco:1"` a `"banco:5"`, e `"oponente.ativo"` para o outro lado.

| `acao` | Campos | O que se vê |
| --- | --- | --- |
| `comprar` | `carta` | sai do deck, vira e vai para a mão |
| `jogar_no_banco` | `carta` | Pokémon Básico desce no banco |
| `evoluir` | `carta`, `alvo` | encaixa por cima com flash dourado |
| `ligar_energia` | `carta`, `alvo` | o ícone de energia voa até o Pokémon |
| `jogar_treinador` | `carta` (`alvo` se for Ferramenta) | carta grande no centro por 1 s; depois descarte, estádio ou Pokémon |
| `buscar` | `cartas` | cartas saem do deck reveladas (efeito de carta) |
| `descartar` | `cartas` | da mão para o descarte (efeito de carta) |
| `recuar` | `para` | troca o Ativo com o banco e descarta a energia do custo |
| `atacar` | `ataque` (`dano` se for variável) | avança, mostra nome e dano, põe os marcadores |
| `dano` | `alvo`, `valor` | marcadores de 10/50/100 |
| `nocaute` | `alvo` | treme, fica cinza e vai para o descarte |
| `promover` | `banco` | sobe um Pokémon do banco para Ativo |
| `pegar_premio` | `carta` ou `cartas` | o prêmio vira e vai para a mão |
| `fim_de_turno` | | passa a vez |
| `pausa` | `duracao` | só espera |

Para o oponente agir, ponha `"lado": "oponente"` na ação ou use `fim_de_turno` antes. Qualquer ação aceita `"selo": "vitória"` (ou outro texto curto), que aparece grande no centro da mesa enquanto a ação dura.

**Regras conferidas** antes de renderizar: 1 energia da mão por turno, 1 Apoiador por turno, 1 Estádio por turno, recuar 1 vez por turno (e pagar o custo), não evoluir no turno em que o Pokémon entrou nem no primeiro turno do jogador, quem começa não ataca nem joga Apoiador no primeiro turno, nada depois do ataque, só Básico vai para o banco (máximo 5), a evolução precisa bater com a carta de baixo, o ataque precisa existir na carta e a energia precisa pagar o custo. Fraqueza e resistência entram na conta do dano. Se o roteiro quebrar regra, o comando lista os erros e não renderiza.

### Apresentador: Kai e Faísca

O Kai apresenta todas as aulas, com o Faísca de companheiro. Eles são personagens 3D (`public/personagens/kai.glb` e `faisca.glb`, exportados do Blender; os originais `.blend` e `.fbx` ficam em `personagens-fonte/`).

- **Gancho:** Kai grande acenando, Faísca voando ao lado, título em cima.
- **Durante a aula:** Kai do peito para cima no canto de baixo à esquerda, e a legenda vira um balão de fala ao lado dele. O conteúdo das cenas termina mais acima para dar espaço.
- **CTA:** Kai fazendo joinha e Faísca feliz, embaixo do "SALVA".
- A boca do Kai segue a narração quadro a quadro: abre com a energia da voz, fecha entre as sílabas e arredonda nas vogais "o" e "u". Ela se mexe 2 quadros antes do som, como na fala real (`ANTECIPACAO` em `scripts/preparar.ts`). A boca e as piscadas que vêm nas animações do Blender são ignoradas; ele pisca sozinho em intervalos irregulares.
- Na troca de cena eles deslizam de uma posição para a outra.

Gestos do Kai: `parado`, `acenando`, `falando`, `apontando`, `comemorando`, `joinha`, `pensando`. Do Faísca: `parado`, `feliz`, `apontando`, `curioso`, `em_pe`, `falando`. Cada tipo de cena já tem um gesto padrão; para trocar numa cena, use `"kai": "joinha"`, ou uma lista com tempos dentro da cena: `"kai": [{"em": 0, "animacao": "falando"}, {"em": 3.2, "animacao": "joinha"}]`. O Faísca muda com `"faisca": "feliz"`. Para fazer uma aula sem os personagens, ponha `"apresentador": false` no roteiro.

As posições e os gestos padrão ficam em `src/personagens/Apresentador.tsx`; o espaço que eles ocupam na tela, em `src/layout.tsx`. O render usa WebGL por software (`gl: 'swangle'`), então funciona sem placa de vídeo, mas fica mais lento.

### Narrador

O narrador é um só para todas as aulas e fica em `narrador.json`:

```json
{"motor": "kokoro", "voz": "pm_santa", "velocidade": 1.1}
```

Com `"narracao": "auto"` no roteiro, o comando `aula` faz tudo sozinho:

1. O narrador fala cada legenda (o texto, sem os asteriscos), na ordem.
2. Onde a frase não cabe no tempo da cena, a cena estica o que faltar e empurra o resto para a frente.
3. A legenda entra palavra por palavra no tempo da fala, e a trilha sai em `audio/<aula>-narracao.mp3`.

Ajustes no roteiro:

- `"fala"` numa legenda ou ação da mesa troca o que é dito sem mudar o que aparece: `{"legenda": "*70* de dano", "fala": "Setenta de dano."}`. Escreva números por extenso na fala. `"fala": ""` deixa a legenda muda.
- `"falas": [{"texto": "Salva pra próxima partida.", "em": 0.25}]` numa cena faz o narrador falar sem legenda na tela (bom para o gancho e o CTA).
- Em `lista` e `riscado`, com uma legenda por item, cada item entra junto com a frase dele.

Os dois motores são vozes neurais que rodam no seu computador, de graça e sem internet depois de instalados. Precisam de Python 3. Na primeira vez o comando instala o motor e baixa a voz na pasta `.narrador/`. Se o roteiro e o `narrador.json` não mudaram, a narração é reaproveitada e nada disso é necessário.

| `motor` | `voz` | Como é | Download |
| --- | --- | --- | --- |
| `piper` | `pt_BR-faber-medium` | masculina | 60 MB |
| `piper` | `pt_BR-cadu-medium` | masculina | 60 MB |
| `piper` | `pt_BR-jeff-medium` | masculina | 60 MB |
| `kokoro` | `pf_dora` | feminina | 325 MB |
| `kokoro` | `pm_alex` | masculina | 325 MB |
| `kokoro` | `pm_santa` | masculina, mais grave (a atual, a mais clara nos testes) | 325 MB |

A narração passa por um tratamento de voz (corte de grave, presença, brilho, compressão leve e volume padronizado em -15 LUFS), definido em `tratamentoDaVoz` no `scripts/narrador.ts`.

Para ouvir todas: `npm run narrar -- --amostras` (grava em `out/amostras/`). Trocar `motor` e `voz` muda o narrador de todas as aulas dali em diante; as já renderizadas ficam como estão. `velocidade` acima de 1 fala mais rápido.

### Narração gravada por você e música

- `"narracao": "audio/aula-02.mp3"` usa um áudio seu em volume cheio. Nesse caso ponha `inicio` (segundo do vídeo) em cada cena para casar com a fala.
- Para a legenda acompanhar a sua fala palavra por palavra, informe a transcrição com tempos:
  `"narracao": {"arquivo": "audio/aula-02.mp3", "transcricao": "audio/aula-02.json"}`.
  Aceita a saída do Whisper (`whisper audio.mp3 --language pt --word_timestamps True --output_format json`) ou uma lista `[{"palavra": "olha", "inicio": 0.5, "fim": 0.9}]`.
- `"musica": "audio/trilha.mp3"` toca em loop a 15% por baixo da narração (mude com `{"arquivo": "...", "volume": 0.1}`).

## Identidade visual: "Estilo Arena"

Segue o guia de identidade (Estilo Arena), com o nome Escola Umbra e o @escolaumbratcg.

- **Cores** (`src/tema.ts`): Sombra `#0A0A0D` (fundo), Vermelho `#E5323F` (marca: painéis, etiquetas, sombra dos títulos), Vermelho escuro `#7D0F1A` (degradê dos painéis), Ouro `#F0C160` (listras, sublinhados, números e palavra-chave da legenda), Branco `#F5F1E8` (títulos e textos).
- **Fontes** (`src/fontes.ts`): o guia usa Impact e Bahnschrift, que são do Windows e não estão no Google Fonts. No vídeo vão as equivalentes mais próximas: **Anton** nos títulos (maiúsculas, inclinadas, com sombra vermelha), **Barlow** nas legendas e textos, **Barlow Condensed** nas etiquetas espaçadas.
- **Peças do estilo** (`src/componentes/Arena.tsx`): título inclinado com sombra vermelha, traço dourado (barra + dois tracinhos), etiqueta em paralelogramo (`[AULA 06] // DO ZERO AO CAMPEONATO`), painel vermelho pontilhado e listras douradas em diagonal.
- **Emblema**: `public/logo.png` é o emblema oficial do guia (lua dourada no círculo preto e vermelho), extraído do PDF com fundo transparente. Aparece no CTA, na capa e no verso das cartas da mesa. Para trocar, salve outro PNG quadrado transparente com o mesmo nome.
- **Área segura** (`src/tema.ts`): nada importante nos 250 px de cima, 450 px de baixo e 160 px da direita; a margem da esquerda é igual à da direita, para o conteúdo ficar no centro real da tela. Os painéis vermelhos do fundo ficam de propósito nos cantos, fora do conteúdo.

## Onde fica cada coisa

```
aulas/            roteiros (um JSON por aula)
src/componentes/  gancho, carta em destaque, lista, pirâmide, comparação, riscado, legenda, CTA
src/mesa/         motor de regras (motor.ts), posições (layout.ts) e animação (Mesa.tsx)
src/personagens/  Kai e Faísca em 3D (Personagem.tsx) e onde eles ficam em cada cena (Apresentador.tsx)
personagens-fonte/ arquivos originais dos personagens (.blend e .fbx)
src/Aula.tsx      junta as cenas; src/Capa.tsx é a capa
scripts/          comandos (aula, capa, narrar, quadros, studio), a busca de cartas e o narrador
narrador.json     a voz do narrador, a mesma para todas as aulas
audio/            narrações geradas e os seus áudios
public/cards/     cache das cartas (não vai para o git; baixa de novo quando falta)
out/              vídeos e capas
```

## Observações

- A API só tem as cartas em inglês, então o nome do ataque aparece em inglês.
- A API falha de vez em quando (erro 500). O comando tenta de novo sozinho; com uma chave grátis de pokemontcg.io fica mais estável: `POKEMONTCG_API_KEY=sua-chave npm run aula -- ...`
- As imagens das coleções mais novas ficam em `images.scrydex.com`; as outras, em `images.pokemontcg.io`.
- Remotion é gratuito para uso individual e equipes de até 3 pessoas. Acima disso precisa de licença: https://www.remotion.dev/license
