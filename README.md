# Discord+

Aplicativo de conversa local, privado e seguro para crianças (Windows 10/11).

Funciona **sem internet**: perfis, mensagens e respostas dos personagens ficam
guardados no próprio computador. A IA online (Gemini, DeepSeek, etc.) é opcional.

## O que tem nesta versão

- Perfil completo: nome de usuário, nome de exibição, avatar (emoji ou foto), biografia e data de criação
- Login com senha protegida por hash scrypt e limite de tentativas
- Status online / ausente / offline
- Canais de texto: Geral, Roblox, Desenhos, Garry's Mod e NextBots + canais personalizados
- Personagens virtuais (RoboMax, Pixel, Nexty, Block, MaxBot e Pibby) que respondem localmente
- Amigos (pedido + aceite) e mensagens particulares (DM)
- Edição e exclusão das próprias mensagens
- Busca de mensagens
- Lista de membros
- Tema claro e escuro
- Filtro de palavras inadequadas
- Histórico salvo em SQLite local + backup automático (7 backups)
- IA online opcional (chat + geração de imagens + criação de novos personagens), protegida por senha master

## Requisitos

- Windows 10 ou 11
- Node.js 20+ (apenas para desenvolvimento e build)

## Como rodar (desenvolvimento)

```bat
scripts\install.bat
scripts\run.bat
```

## Como gerar o instalador

```bat
scripts\build.bat
```

O instalador sai em `dist\Discord-Plus-Setup-1.0.0.exe`.

## Acesso do responsável

Na primeira execução, o aplicativo gera uma senha aleatória e a mostra uma única vez.
O usuário administrativo é `responsavel`. Guarde a senha fora do alcance da criança.

## IA online (opcional)

A IA é desativada por padrão e o app funciona normalmente sem ela. Para ativar:

1. Entre na tela de Configurações (⚙️) com a senha master.
2. Escolha o provedor (OpenRouter ou DeepSeek) e cole a API key.
3. Ligue "Usar IA online".

A chave pode vir da tela de Configurações (salva no banco local) ou das variáveis
de ambiente em `.env` (veja `.env.example`). Quando a IA estiver desligada ou
falhar, os personagens usam respostas locais — e, com a IA ligada, ficam em
silêncio em caso de erro (não quebram a ilusão).

### Modelos recomendados (free)

| Uso | Modelo | Custo |
|-----|--------|-------|
| Chat | `google/gemini-2.0-flash-exp:free` (OpenRouter) | grátis |
| Chat | `deepseek/deepseek-chat` | muito barato |
| Imagem | `google/gemini-2.0-flash-exp:free` | grátis |
| Imagem | `openai/gpt-image-1` | pago |

## Onde ficam os dados

Os dados **não** ficam na pasta de instalação. Ficam em:

```
%APPDATA%\DiscordPlus\
├── discordplus.db     (banco SQLite com perfis e mensagens)
├── backups\           (backups automáticos)
└── (logs)
```

Desinstalar ou atualizar o aplicativo **não apaga** esses dados.

## Estrutura

```
src/
├── main/            processo principal (Electron + SQLite + segurança + IA)
│   ├── index.js     janela, IPC, lógica de negócio
│   ├── database.js  SQLite (tabelas e consultas)
│   ├── ia.js        integração com IA (OpenRouter/DeepSeek)
│   ├── security.js  hash de senha
│   └── recovery.js  backups
├── preload/         ponte segura (contextBridge)
├── renderer/        interface (React + Vite)
│   └── src/screens/ Login, Chat, Perfil, Configuracoes
└── shared/          personagens, canais e regras de segurança
```

## Segurança

- Senhas com hash scrypt (nunca em texto puro)
- Limite de tentativas de login
- Conteúdo filtrado antes de salvar
- Dados pessoais e contatos externos ocultados antes de salvar ou enviar à IA
- Personagens identificados como IA e proibidos de alegar que são crianças reais
- Configurações sensíveis protegidas por sessão do responsável
- Telemetria remota desativada por padrão
- Renderer sem acesso direto ao Node (contextIsolation + preload)
- Chaves de IA nunca ficam no código (config local ou variáveis de ambiente)
- Nenhuma integração com o Discord oficial

## Deploy

O app é 100% local (Electron + SQLite), então "deploy" significa gerar o
instalador `Discord-Plus-Setup-1.0.0.exe` com `scripts\build.bat` e distribuí-lo.

Para uso em várias máquinas com histórico compartilhado, é necessário um backend
de sincronização (ex.: Supabase) — etapa futura, ainda não implementada.

## Próximas etapas (planejado)

- Painel dos responsáveis (horários, notificações, controle de conteúdo)
- Tema alto contraste e fonte ajustável
- Redução de animações
- Sincronização online opcional do histórico
