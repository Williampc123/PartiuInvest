# design-systems.md — Arquitetura e padrões de engenharia

> **Projeto:** Partiu Invest — plataforma de educação e organização financeira familiar.
> **Slogan:** *Seu dinheiro também tem um destino.*
> **Público deste documento:** agente de desenvolvimento (Gemini Antigravity) e pessoas desenvolvedoras.
> **Leia junto:** `design-patterns.md` (visual), `data-model.md` (Firestore e regras), `open-finance.md` (integração bancária), `GEMINI.md` (roteiro por fases).

---

## 0. Regras de ouro (leia primeiro)

1. **Não invente requisitos.** Se algo estiver ambíguo, pare e pergunte antes de implementar.
2. **Comece pelos arquivos da pasta `\modelos`** (ver seção 13). Eles são o ponto de partida visual. Converta para React preservando as classes Tailwind. Não redesenhe.
3. **Clean Architecture + SOLID.** Regras de negócio nunca importam Firebase, React ou HTTP.
4. **Offline-first.** Toda escrita do usuário precisa funcionar sem internet e sincronizar depois (seção 9 e `data-model.md`).
5. **Dinheiro é sempre inteiro em centavos** (`amountCents`). Nunca use `float` para valores.
6. **Segurança no servidor.** Papéis e visibilidade são garantidos por *Firestore Security Rules* e pela API Node, nunca só pela interface.
7. **Sem segredos no repositório.** Chaves de serviço, credenciais de provedores e tokens ficam em variáveis de ambiente.
8. **Idioma:** código, commits e nomes técnicos em **inglês**; textos da interface em **português do Brasil (pt-BR)**.
9. **Custo zero como restrição.** O projeto roda dentro do plano gratuito (Spark) do Firebase. Ver seção 6.4 (cotas) antes de criar consultas ou escritas em massa.

---

## 1. Stack tecnológica

| Camada | Tecnologia | Observações |
|---|---|---|
| Frontend | **React** + **TypeScript (strict)** | SPA/PWA, Vite como bundler |
| Estilo | **Tailwind CSS 3.4** | Mesmo `tailwind.config` dos modelos (ver `design-patterns.md`) |
| Roteamento | React Router | Rotas por feature, com *lazy loading* |
| Estado de UI | Zustand | Só estado de interface. Dados vêm do Firestore via repositórios |
| Formulários | React Hook Form + **Zod** | Zod também valida dados vindos do Firestore e da API |
| Datas | date-fns (`pt-BR`) | Fuso padrão `America/Sao_Paulo` |
| PWA / offline | `vite-plugin-pwa` (Workbox) + cache persistente do Firestore | Ver seção 9 |
| Banco | **Cloud Firestore** | Plano Spark (gratuito) |
| Auth | **Firebase Authentication** | E-mail/senha, Google e *custom token* (perfis de menores) |
| Backend próprio | **Node.js + TypeScript + Express** (`apps/api`) | Usa **Firebase Admin SDK**. Sem Cloud Functions |
| Validação na API | Zod | Contratos compartilhados em `packages/shared` |
| Testes | Vitest, Testing Library, Playwright, `@firebase/rules-unit-testing` | Emuladores do Firebase |
| Qualidade | ESLint (flat config), Prettier, Husky, lint-staged, commitlint | |
| Gerenciador | **pnpm** (workspaces) | |

**Fora do escopo:** Cloud Functions, Blaze obrigatório, Realtime Database, bibliotecas de UI pesadas (MUI, Ant). Componentes são próprios, em Tailwind.

---

## 2. Estrutura de pastas (monorepo)

```
partiu-invest/
├─ modelos/                          # \modelos — HTML/Tailwind prontos (ponto de partida visual)
│  ├─ partiu-invest-login-tailwind.html
│  ├─ partiu-invest-painel-tailwind.html
│  ├─ logo-partiu-invest.png
│  └─ icone-partiu-invest.png
├─ docs/                             # estes documentos (.md)
├─ apps/
│  ├─ web/                           # React PWA
│  │  ├─ public/                     # ícones PWA, manifest
│  │  ├─ src/
│  │  │  ├─ app/                     # bootstrap, providers, router, composition root (DI)
│  │  │  ├─ core/                    # shared kernel: Money, Result, erros, ids, datas
│  │  │  ├─ features/                # uma pasta por contexto de negócio (ver 2.1)
│  │  │  │  ├─ auth/
│  │  │  │  ├─ family/               # membros, convites, papéis
│  │  │  │  ├─ accounts/             # contas (manuais e Open Finance)
│  │  │  │  ├─ boxes/                # caixinhas (virtuais)
│  │  │  │  ├─ transactions/         # movimentações
│  │  │  │  ├─ planning/             # orçamento, metas, fechamento do mês
│  │  │  │  ├─ investments/          # acompanhamento e educação
│  │  │  │  ├─ open-finance/         # conexão e importação (cliente)
│  │  │  │  ├─ dashboard/            # visão geral, saúde financeira
│  │  │  │  └─ learning/             # trilhas e aulas
│  │  │  ├─ infrastructure/          # Firebase client, cache offline, HTTP client da API
│  │  │  ├─ shared/                  # UI genérica (Button, Card...), hooks, utils de apresentação
│  │  │  └─ styles/                  # tailwind.css, tokens
│  │  ├─ index.html
│  │  ├─ tailwind.config.ts
│  │  └─ vite.config.ts
│  └─ api/                           # Node.js API
│     ├─ src/
│     │  ├─ config/                  # env validado com Zod
│     │  ├─ modules/                 # auth, families, invites, open-finance, summaries
│     │  │  └─ <module>/{domain,application,infrastructure,http}/
│     │  ├─ shared/                  # middlewares, erros, logger
│     │  └─ server.ts
│     ├─ Dockerfile
│     └─ .env.example
├─ packages/
│  └─ shared/                        # contratos: schemas Zod, tipos, enums (papéis, tipos de caixinha)
├─ firebase/
│  ├─ firestore.rules
│  ├─ firestore.indexes.json
│  └─ firebase.json                  # emuladores + hosting do web
├─ .github/workflows/ci.yml
├─ .editorconfig · .prettierrc · eslint.config.js · commitlint.config.js
└─ README.md
```

### 2.1 Estrutura interna de cada *feature* (frontend)

```
features/boxes/
├─ domain/
│  ├─ entities/Box.ts                 # entidade + invariantes
│  ├─ value-objects/BoxType.ts
│  ├─ repositories/BoxRepository.ts   # PORT (interface)
│  └─ services/BoxProjectionService.ts# regras puras (ex.: projeção de meta)
├─ application/
│  ├─ use-cases/DepositToBox.ts
│  ├─ use-cases/WithdrawFromBox.ts
│  ├─ use-cases/TransferBetweenBoxes.ts
│  └─ dto/
├─ infrastructure/
│  ├─ FirestoreBoxRepository.ts       # ADAPTER (implementa o port)
│  └─ mappers/boxMapper.ts            # documento Firestore <-> entidade
└─ presentation/
   ├─ pages/BoxesPage.tsx
   ├─ components/BoxCard.tsx
   ├─ hooks/useBoxes.ts               # ponte para use cases (view-model)
   └─ index.ts                        # API pública da feature
```

Cada feature expõe apenas o que está em `index.ts`. **Nenhuma feature importa arquivos internos de outra.**

---

## 3. Clean Architecture: camadas e regra de dependência

```
presentation  →  application  →  domain
                      ↑
infrastructure ───────┘   (implementa ports definidos em domain)
```

| Camada | Pode conter | **Não pode** importar |
|---|---|---|
| `domain` | Entidades, value objects, regras puras, **interfaces** (ports) | React, Firebase, fetch, Zod de infraestrutura |
| `application` | Casos de uso (um por ação), DTOs, orquestração | React, Firebase (só via ports) |
| `infrastructure` | Adapters: Firestore, HTTP, storage, mappers | React |
| `presentation` | Componentes, páginas, hooks (view-models) | Firebase diretamente |

- A **composição** (quem cria qual implementação) acontece **somente** em `app/di` (*composition root*).
- Faça valer a regra com **ESLint** (`eslint-plugin-boundaries` ou `no-restricted-imports`). O CI falha se uma camada violar a dependência.
- Firestore só aparece em `infrastructure/`. Se um `import { ... } from 'firebase/firestore'` surgir em `domain`, `application` ou `presentation`, é bug de arquitetura.

---

## 4. SOLID aplicado (com exemplos do projeto)

**S — Responsabilidade única.** Um caso de uso faz uma coisa (`DepositToBox`, `TransferBetweenBoxes`). Um componente apresenta; não decide regra.

**O — Aberto/fechado.** Novas fontes de movimentação (manual, arquivo OFX, Open Finance) entram como novas implementações de `TransactionSource`, sem alterar os casos de uso.

**L — Substituição de Liskov.** Qualquer `OpenFinanceProvider` (Pluggy, importação de arquivo, *fake* de teste) deve honrar o mesmo contrato e ser intercambiável.

**I — Segregação de interfaces.** Prefira ports pequenos: `BoxReader`, `BoxWriter` em vez de um `BoxRepository` gigante quando o consumidor só lê.

**D — Inversão de dependência.** Casos de uso dependem de interfaces; o adapter é injetado.

```ts
// domain/repositories/BoxRepository.ts  (PORT)
export interface BoxRepository {
  findById(familyId: FamilyId, boxId: BoxId): Promise<Box | null>;
  observeVisibleTo(memberId: MemberId, familyId: FamilyId, cb: (boxes: Box[]) => void): Unsubscribe;
  applyMovement(movement: BoxMovement): Promise<Result<void, DomainError>>; // batch atômico offline-safe
}

// application/use-cases/DepositToBox.ts
export class DepositToBox {
  constructor(private readonly boxes: BoxRepository, private readonly clock: Clock, private readonly ids: IdGenerator) {}

  async execute(input: DepositInput): Promise<Result<void, DomainError>> {
    const amount = Money.fromCents(input.amountCents);      // valida > 0
    if (amount.isErr()) return amount;
    const movement = BoxMovement.deposit({ id: this.ids.next(), boxId: input.boxId, amount: amount.value, at: this.clock.now(), by: input.memberId });
    return this.boxes.applyMovement(movement);
  }
}

// app/di/container.ts (composition root)
const boxRepo = new FirestoreBoxRepository(firestore);
export const depositToBox = new DepositToBox(boxRepo, systemClock, uuidGenerator);
```

---

## 5. Padrões de código

### 5.1 TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Proibido `any` (use `unknown` + Zod). Proibido `// @ts-ignore` sem justificativa.
- *Branded types* para IDs: `type BoxId = string & { readonly __brand: 'BoxId' }`.
- Preferir `readonly`, `type` para uniões e `interface` para contratos de classes.

### 5.2 Nomenclatura
| Item | Padrão | Exemplo |
|---|---|---|
| Arquivos de componente | `PascalCase.tsx` | `BoxCard.tsx` |
| Arquivos de lógica | `PascalCase.ts` para classes, `camelCase.ts` para funções | `DepositToBox.ts`, `boxMapper.ts` |
| Hooks | `useXxx` | `useBoxes` |
| Casos de uso | verbo no imperativo | `TransferBetweenBoxes` |
| Ports / adapters | `XxxRepository` / `FirestoreXxxRepository` | |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_BOX_NAME_LENGTH` |
| Coleções Firestore | inglês, plural, `camelCase` | `boxes`, `boxMovements` |
| Campos Firestore | `camelCase`, dinheiro com sufixo `Cents` | `balanceCents` |

**Glossário pt-BR ↔ código:** caixinha = `box` · movimentação = `transaction` · planejamento = `planning` (`budgets`, `goals`) · patrimônio = `netWorth` · chefe de família = `chefe-familia` · cônjuge = `conjuge` · filho = `filho` · "Sem destino" = `unallocated`.

### 5.3 Dinheiro, datas e localização
- `Money` (value object) em `core/`: guarda `cents: number` (inteiro seguro), nunca `float`. Operações retornam novo `Money`.
- Formatação apenas na apresentação: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Datas persistidas como `Timestamp` (UTC). Competência mensal em `period: 'yyyy-MM'` (fuso `America/Sao_Paulo`).
- Textos da UI em arquivo de mensagens (`shared/i18n/pt-BR.ts`), não espalhados em JSX.

### 5.4 Erros
- Domínio e aplicação retornam `Result<T, E>` (sem exceções para fluxo esperado).
- Exceções só para falhas inesperadas; capturadas por *Error Boundary* (UI) e middleware (API).
- Mensagens ao usuário: claras, curtas e sem culpar (ver tom de voz em `design-patterns.md`).

### 5.5 Componentes React
- Componentes de apresentação são **burros**: recebem *props*, emitem eventos.
- Lógica em hooks/casos de uso. Nada de `useEffect` para buscar dados diretamente; use hooks de repositório.
- Acessibilidade obrigatória: rótulos, foco visível, `aria-*` corretos, contraste AA (ver `design-patterns.md`).
- Listas grandes: paginação (30 itens) e virtualização quando necessário.

---

## 6. Firebase

### 6.1 Variáveis de ambiente (frontend)
As chaves do **app web** do Firebase são identificadores públicos; quem protege os dados são as **Security Rules**. Mesmo assim, **não escreva no código**. Use `.env.local` (e adicione ao `.gitignore`):

```bash
# apps/web/.env.local  (valores do projeto "partiuinvest")
VITE_FIREBASE_API_KEY=AIzaSyDk4iZIu-SxSkpGGNyf4fO0lDgO5cuad98
VITE_FIREBASE_AUTH_DOMAIN=partiuinvest.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=partiuinvest
VITE_FIREBASE_STORAGE_BUCKET=partiuinvest.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=874876181201
VITE_FIREBASE_APP_ID=1:874876181201:web:55333eb78c386b703583f0
VITE_FIREBASE_MEASUREMENT_ID=G-EB9RCXJE80
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_EMULATORS=true
```

Além disso: restringir a API key por domínio (Google Cloud Console), ativar **App Check** e manter as regras restritivas (`data-model.md`).

### 6.2 Inicialização (com cache offline persistente)

```ts
// infrastructure/firebase/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }), // offline
});

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

**Analytics (LGPD):** só inicializar `getAnalytics` **após consentimento** do usuário e se `isSupported()` for verdadeiro. Não enviar dados financeiros nem identificadores pessoais em eventos.

### 6.3 Papéis via *custom claims*
Definidos pela **API Node** com o Admin SDK (`setCustomUserClaims`), sem Cloud Functions:

```json
{ "familyId": "<id da família>", "memberId": "<id do membro>", "role": "chefe-familia | conjuge | filho" }
```

Após alterar claims, o cliente chama `getIdToken(true)` para renovar o token. Manter o objeto de claims pequeno (limite de 1000 bytes).

### 6.4 Cotas do plano gratuito (Spark) — **restrição de projeto**
Cotas vigentes (conferir em firebase.google.com/pricing antes de escalar):

| Recurso | Cota gratuita |
|---|---|
| Firestore: armazenamento | 1 GiB |
| Firestore: leituras | 50 mil/dia |
| Firestore: escritas | 20 mil/dia |
| Firestore: exclusões | 20 mil/dia |
| Firestore: tráfego de saída | 10 GiB/mês |
| Authentication (e-mail, Google) | sem limite prático |

**Consequências no código:**
- Cada documento retornado por uma consulta conta 1 leitura (leituras do **cache local** não contam). Portanto: paginar, usar `limit()`, ouvir apenas o necessário, evitar *listeners* em coleções grandes.
- Agregados (totais familiares, resumos) ficam em **documentos de resumo** (`summaries`), não recalculados lendo centenas de movimentações.
- Escritas em lote (`writeBatch`, até 500 operações) reduzem *round-trips* mas **não** reduzem a cota: cada documento escrito conta.
- Importações do Open Finance: limitar histórico inicial (padrão 90 dias) e importar em lotes.
- Evitar `get()`/`exists()` em Security Rules quando possível (cada uso pode gerar leitura cobrada). Por isso o modelo usa `viewerIds` (ver `data-model.md`).
- Monitorar consumo no console do Firebase. Se o uso passar de ~60% das cotas, registrar alerta no README.

---

## 7. API Node.js (`apps/api`)

**Papel:** tudo que não pode ou não deve rodar no navegador: segredos de provedores, importação do Open Finance, emissão de convites e *custom tokens*, definição de claims, recálculo de resumos, exclusão de conta (LGPD). **Escreve no Firestore com Admin SDK** (ignora as Security Rules, por isso valida tudo).

### 7.1 Estrutura e padrões
- Express + TypeScript. Módulos independentes (`auth`, `families`, `invites`, `open-finance`, `summaries`), cada um com `domain / application / infrastructure / http` (mesma Clean Architecture).
- Rotas versionadas: `/v1/...`.
- Middlewares: `helmet`, CORS com lista de origens permitidas, `express-rate-limit`, `pino` (logs sem dados sensíveis), verificação de **Firebase ID token** (`Authorization: Bearer <idToken>`), validação de corpo com Zod, tratamento de erros único.
- Idempotência: endpoints de importação e webhooks aceitam repetição sem duplicar dados (IDs determinísticos).
- Configuração validada na inicialização (`config/env.ts` com Zod). Se faltar variável, o servidor não sobe.

### 7.2 Endpoints principais

| Método e rota | Função |
|---|---|
| `POST /v1/onboarding/family` | Cria a família do chefe, o membro e as claims |
| `POST /v1/members` | Chefe cadastra membro (cônjuge, filho adulto ou menor) |
| `POST /v1/invites` · `POST /v1/invites/redeem` | Convite para adultos (e-mail/link) |
| `POST /v1/invites/minor` · `POST /v1/invites/minor/redeem` | Link exclusivo para menor (sem dados pessoais) |
| `POST /v1/members/:id/revoke` | Revoga acesso e sessões do membro |
| `POST /v1/summaries/recompute` | Recalcula resumos do período |
| `POST /v1/open-finance/*` | Conexão, sincronização e webhook (ver `open-finance.md`) |
| `DELETE /v1/families/:id` | Exclusão completa da família (LGPD) |

### 7.3 Hospedagem gratuita
O plano Spark não executa servidores Node. Opções sem custo fixo (**confirmar condições atuais antes de decidir**):
- **Render (Web Service gratuito):** simples; o serviço "dorme" após inatividade e a primeira chamada demora. Adequado para chamadas iniciadas pelo usuário. Webhooks podem falhar se o serviço estiver dormindo, então implemente *sync* ao abrir o app e reprocessamento.
- **Google Cloud Run:** cota gratuita generosa, mas exige conta de faturamento habilitada.
- Manter a API **containerizada** (`Dockerfile`) e sem estado, para mudar de host sem reescrever.

Segredos (`FIREBASE_SERVICE_ACCOUNT_JSON` em base64, credenciais do provedor) ficam nas variáveis do host, **nunca no Git**.

```bash
# apps/api/.env.example
PORT=8080
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=partiuinvest
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=
OPEN_FINANCE_PROVIDER=pluggy            # pluggy | file
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=
WEBHOOK_SECRET=
```

---

## 8. Multiusuário e papéis (resumo)

- Cada **chefe de família** possui uma família isolada: `families/{familyId}` (todos os dados dentro dela). Ver `data-model.md`.
- Papéis: `chefe-familia`, `conjuge`, `filho`. Menores de 18 anos são **perfis gerenciados** acessados por **link exclusivo**, sem dados pessoais (apenas apelido definido pelo chefe).

**Matriz de visibilidade**

| Dado | Chefe | Cônjuge | Filho |
|---|---|---|---|
| Total da família (resumos) | ✔ | ✔ | ✔ |
| Individual do chefe | ✔ | só se compartilhado | só se compartilhado |
| Individual do cônjuge | ✔ | ✔ | só se compartilhado |
| Individual de filho(s) | ✔ | ✔ | só o próprio |
| Criar/editar contas e caixinhas próprias | ✔ | ✔ | ✔ |
| Caixinhas da família (compartilhadas) | ✔ | ✔ | ✔ (ver; editar conforme permissão) |
| Cadastrar/revogar membros | ✔ | ✗ | ✗ |

---

## 9. Offline-first

1. **Cache persistente do Firestore** ativo (seção 6.2). Leituras e escritas funcionam offline; escritas ficam em fila e sincronizam ao voltar a conexão.
2. **PWA:** *app shell* em cache (Workbox), manifesto e ícones, instalável no celular.
3. **IDs gerados no cliente** (`doc(collection(...)).id`), para criar documentos offline sem colisão. Importações usam IDs determinísticos (`of_<provedor>_<idExterno>`).
4. **Sem `runTransaction` em fluxos offline** (transações exigem conexão). Use `writeBatch`.
5. **Saldos com `increment()`** e movimentos imutáveis (*ledger*): duas pessoas offline somando ao mesmo saldo não se sobrescrevem. Um job da API reconcilia o saldo a partir do histórico se houver divergência.
6. **Exclusão lógica** (`deletedAt`) em vez de apagar, para sincronizar corretamente.
7. **Resolução de conflitos:** *last-write-wins* por campo, com `updatedAt`. Campos monetários usam `increment`.
8. **UI de sincronização:** indicar "Sem conexão" e "Sincronizando…" (`metadata.hasPendingWrites` / `fromCache`). Nunca bloquear o usuário por estar offline.
9. Dados dependentes do servidor (resumos familiares, Open Finance) exibem "atualizado em…" e funcionam com o último valor conhecido.

---

## 10. Testes e qualidade

| Tipo | Ferramenta | O que cobrir |
|---|---|---|
| Unidade | Vitest | `domain` e `application` (sem Firebase), meta ≥ 80% nessas camadas |
| Componentes | Testing Library | Estados: carregando, vazio, erro, offline |
| Regras de segurança | `@firebase/rules-unit-testing` + emulador | **Matriz completa** (papel × dono × visibilidade), ver `data-model.md` |
| Integração | Vitest + emuladores | Repositórios Firestore e API |
| Ponta a ponta | Playwright | Cadastro do chefe, convite, caixinha, modo offline |

**CI** (`.github/workflows/ci.yml`): `lint` → `typecheck` → `test` → `test:rules` → `build`. Bloquear *merge* se falhar.

**Definição de pronto (DoD) por tarefa:** tipos sem erro, testes passando, regras de segurança atualizadas e testadas, acessibilidade verificada, funciona offline, textos em pt-BR, sem segredos, documentação atualizada.

---

## 11. Segurança e privacidade (LGPD)

- **Menor privilégio:** clientes só escrevem o que as regras permitem; escritas sensíveis (membros, Open Finance, claims) só pela API.
- **Dados mínimos:** perfis de menores guardam apenas apelido, cor e avatar. Sem CPF, e-mail ou data de nascimento.
- **Consentimento registrado:** coleção `consents` (finalidade, data, versão do texto) para Open Finance e Analytics.
- **Revogação e exclusão:** o usuário pode desconectar bancos e apagar dados; a família inteira pode ser excluída (`DELETE /v1/families/:id`).
- **Trilha de auditoria** (`auditLogs`, escrita só pela API) para ações sensíveis: convites, revogações, conexões bancárias.
- **Link de menor:** token aleatório de 256 bits, guardado só como *hash*, uso único, com validade, revogável (`data-model.md`).
- **Sem recomendação de investimentos.** O produto é educativo e de acompanhamento. Conteúdo sobre "CDB de liquidez diária" é informativo, sobre a **categoria**, nunca sobre instituição ou produto específico, sempre com o aviso: *"Conteúdo educativo. Não é recomendação de investimento."*
- **Revisão jurídica** de LGPD (dados de menores, consentimentos) e de regras do Open Finance é **necessária antes de ir ao ar**.

---

## 12. Git, versionamento e revisão

- Branches: `main` (protegida) · `feat/…` · `fix/…` · `chore/…`.
- **Conventional Commits** (`feat(boxes): add transfer between boxes`), validados por commitlint.
- PRs pequenos, com descrição e checklist do DoD. Revisão obrigatória.
- Versionamento semântico das rotas da API e do `schemaVersion` dos documentos (ver `data-model.md`).

---

## 13. Pasta `\modelos` (arquivos prontos — ponto de partida)

A pasta `\modelos` (na raiz do repositório: `/modelos`) contém telas **já desenhadas e aprovadas** em HTML + Tailwind CSS:

| Arquivo | O que é | Destino no React |
|---|---|---|
| `partiu-invest-login-tailwind.html` | Tela de login (vidro, painel com moedas de ouro) | `features/auth/presentation/pages/LoginPage.tsx` |
| `partiu-invest-painel-tailwind.html` | Painel principal (menu, patrimônio, saúde financeira, jornada, caixinhas, gráficos, contas) | `features/dashboard/presentation/pages/DashboardPage.tsx` + componentes |
| `logo-partiu-invest.png` | Logo com fundo transparente | `apps/web/public/` e `src/assets/` |
| `icone-partiu-invest.png` | Ícone "P" (menu compacto, PWA) | idem (gerar ícones PWA a partir dele) |

**Como usar (obrigatório):**
1. **Não descarte os modelos.** Eles definem o resultado visual esperado.
2. Converta cada bloco em **componentes React** (`Card`, `GlassPanel`, `ProgressBar`, `BoxCard`, `HealthGauge`, `JourneySteps`, `AreaChart`, `DonutChart`, `BarChart`, `Sidebar`, `TabBar`…) mantendo as **mesmas classes Tailwind**, o `tailwind.config` e os componentes `@apply` (`.glass`, `.btn-gold`, etc.), migrados para `styles/tailwind.css`.
3. Os gráficos dos modelos são SVG gerados por JavaScript. Podem ser reescritos como componentes React com o mesmo visual (SVG próprio, sem biblioteca de gráficos).
4. **Todos os valores dos modelos são fictícios** (ex.: "Lucas Martins", R$ 48.320,00). Substituir por dados reais do Firestore; nunca deixar dados de exemplo em produção.
5. O botão do Google e o cartão "Patrimônio" flutuante do login são ilustrativos; ligar ao Firebase Auth e remover/ajustar o cartão conforme decisão de produto.
6. Se surgir uma tela nova, seguir `design-patterns.md` e **pedir aprovação do visual** antes de finalizar.

---

## 14. Regras de domínio já decididas

- **Caixinhas são virtuais.** Não movimentam dinheiro real. O saldo "Sem destino" = saldo informado (ou vindo das contas) − soma das caixinhas.
- **Aporte "automático" = lembrete.** O sistema avisa ("no dia 5, guardar R$ 500 na Reserva") e o usuário confirma com um toque.
- **Conferência mensal:** o app pergunta se o saldo continua correto e registra um ajuste (`adjust`) se necessário.
- **Investimentos:** somente acompanhamento e educação. Sem recomendar ativos, instituições ou quantias.
- **Saúde financeira (0–100)**, função pura no domínio, pesos iniciais (a validar): reserva de emergência 30 · gastos sobre renda 30 · dívidas 20 · constância de aportes 20.
- **Jornada:** Controle → Consciência → Planejamento → Investimento → Patrimônio (etapa atual calculada por marcos concluídos).