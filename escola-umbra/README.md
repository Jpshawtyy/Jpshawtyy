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

| Comando | O que faz |
| --- | --- |
| `npm run aula -- <roteiro>` | MP4 final e capa PNG em `out/` |
| `npm run previa -- <roteiro>` | MP4 pequeno e rápido (432x768) para conferir o ritmo |
| `npm run validar -- <roteiro>` | Só confere roteiro, cartas e regras |
| `npm run narrar -- <roteiro>` | Gera só a narração e mostra o tempo de cada frase |
| `npm run narrar -- --amostras` | Grava uma amostra de cada voz em `out/amostras/`, para escolher o narrador |
| `npm run quadros -- <roteiro> --guias` | Fotos dos pontos de transição em `out/quadros/`, com a área segura desenhada |
| `npm run studio -- <roteiro>` | Abre o Remotion Studio para ver e ajustar ao vivo |
| `npm run logo -- --forcar` | Refaz a logo provisória em `public/logo.png` |

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
| `carta_destaque` | `carta`, `pill` ("META", "DE VOLTA"), `pill_cor` (`ouro` ou `vermelho`), `titulo` |
| `lista` | `titulo`, `itens` (texto, ou `{"texto", "detalhe", "em", "destaque", "carta"}`; com `destaque` o item não apaga quando o próximo entra, e com `carta` aparece a miniatura da carta no lugar do número) |
| `piramide` | `titulo`, `modo` (`piramide` ou `ranking`), `fonte` (linha pequena citando a origem dos dados), `niveis` da base ao topo: `{"rotulo", "detalhe", "destaque"}`. No `ranking`, cada nível aceita também `carta` (miniatura) e `valor` (preenche a barra na proporção), e o `detalhe` aparece grande à direita |
| `comparacao` | `titulo`, `pill_bons`, `pill_ruins`, `bons` e `ruins` (cartas ou `{"texto"}`) |
| `riscado` | `titulo`, `itens` (texto, ou `{"texto", "em", "riscar_em"}`) |
| `mesa` | `estado` e `acoes` (abaixo) |
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

Para o oponente agir, ponha `"lado": "oponente"` na ação ou use `fim_de_turno` antes.

**Regras conferidas** antes de renderizar: 1 energia da mão por turno, 1 Apoiador por turno, 1 Estádio por turno, recuar 1 vez por turno (e pagar o custo), não evoluir no turno em que o Pokémon entrou nem no primeiro turno do jogador, quem começa não ataca nem joga Apoiador no primeiro turno, nada depois do ataque, só Básico vai para o banco (máximo 5), a evolução precisa bater com a carta de baixo, o ataque precisa existir na carta e a energia precisa pagar o custo. Fraqueza e resistência entram na conta do dano. Se o roteiro quebrar regra, o comando lista os erros e não renderiza.

### Narrador

O narrador é um só para todas as aulas e fica em `narrador.json`:

```json
{"motor": "piper", "voz": "pt_BR-faber-medium", "velocidade": 1.08}
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
| `piper` | `pt_BR-faber-medium` | masculina (a atual) | 60 MB |
| `piper` | `pt_BR-cadu-medium` | masculina | 60 MB |
| `piper` | `pt_BR-jeff-medium` | masculina | 60 MB |
| `kokoro` | `pf_dora` | feminina | 325 MB |
| `kokoro` | `pm_alex` | masculina | 325 MB |
| `kokoro` | `pm_santa` | masculina, mais grave | 325 MB |

Para ouvir todas: `npm run narrar -- --amostras` (grava em `out/amostras/`). Trocar `motor` e `voz` muda o narrador de todas as aulas dali em diante; as já renderizadas ficam como estão. `velocidade` acima de 1 fala mais rápido.

### Narração gravada por você e música

- `"narracao": "audio/aula-02.mp3"` usa um áudio seu em volume cheio. Nesse caso ponha `inicio` (segundo do vídeo) em cada cena para casar com a fala.
- Para a legenda acompanhar a sua fala palavra por palavra, informe a transcrição com tempos:
  `"narracao": {"arquivo": "audio/aula-02.mp3", "transcricao": "audio/aula-02.json"}`.
  Aceita a saída do Whisper (`whisper audio.mp3 --language pt --word_timestamps True --output_format json`) ou uma lista `[{"palavra": "olha", "inicio": 0.5, "fim": 0.9}]`.
- `"musica": "audio/trilha.mp3"` toca em loop a 15% por baixo da narração (mude com `{"arquivo": "...", "volume": 0.1}`).

## Identidade visual

Tudo em `src/tema.ts`: cores, área segura (250 px em cima, 450 px embaixo, 160 px à direita) e o `@`. Fontes em `src/fontes.ts` (Unbounded 700, Inter 400/500, JetBrains Mono 500, via `@remotion/google-fonts`).

`public/logo.png` é uma logo provisória (lua + capelo) gerada pelo projeto. Se você tem a oficial, salve por cima com o mesmo nome (PNG quadrado, fundo transparente).

## Onde fica cada coisa

```
aulas/            roteiros (um JSON por aula)
src/componentes/  gancho, carta em destaque, lista, pirâmide, comparação, riscado, legenda, CTA
src/mesa/         motor de regras (motor.ts), posições (layout.ts) e animação (Mesa.tsx)
src/Aula.tsx      junta as cenas; src/Capa.tsx é a capa
scripts/          comandos (aula, narrar, quadros, studio, logo), a busca de cartas e o narrador
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
