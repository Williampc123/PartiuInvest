# open-finance.md — Arquitetura de Integração Open Finance e Sincronização Bancária

> **Projeto:** Partiu Invest  
> **Camada:** Backend Node.js (`apps/api`) + Frontend React (`apps/web`)  
> **Público:** Agente Gemini Antigravity e Engenharia de Software.

---

## 1. Visão Geral

A integração com o **Open Finance Brasil** permite a conexão automática e segura de contas bancárias (corrente, poupança, cartões de crédito e investimentos) para membros da família.

### 1.1 Princípios de Segurança e LGPD
1. **Credenciais Bancárias Invioláveis:** O usuário nunca digita senha bancária no Partiu Invest. O consentimento ocorre via redirecionamento/widget oficial do provedor regulado pelo Banco Central (ex: Pluggy / Belvo).
2. **Somente Leitura:** O sistema apenas solicita escopo de leitura de saldos e transações (`READ_ACCOUNTS`, `READ_TRANSACTIONS`). Não há transações financeiras ativas.
3. **Associação por Membro da Família:** Cada conexão pertence a um membro específico (`ownerMemberId`), com opção de compartilhamento na visão familiar (`visibility: 'family'`).
4. **Isolamento de Segredos:** Tokens de API e Webhook Secrets residem exclusivamente nas variáveis de ambiente do backend Node.js (`apps/api`).

---

## 2. Fluxo de Conexão Bancária (Frontend + Backend)

```
Usuário (React)         API Node.js (apps/api)      Provedor (ex: Pluggy)       Banco / Open Finance
      |                           |                            |                         |
      | 1. Clicar "Conectar Banco"|                            |                         |
      |-------------------------->|                            |                         |
      |                           | 2. Criar Connect Token     |                         |
      |                           |--------------------------->|                         |
      |                           | 3. Retornar Connect Token  |                         |
      |                           |<---------------------------|                         |
      | 4. Retornar Token         |                            |                         |
      |<--------------------------|                            |                         |
      |                                                        |                         |
      | 5. Abrir Widget Seguro no Navegador                   |                         |
      |------------------------------------------------------->|                         |
      |                                                        | 6. Autenticar no Banco  |
      |                                                        |------------------------>|
      | 7. Conexão Realizada (ItemId)                          |                         |
      |<-------------------------------------------------------|                         |
      |                                                        |                         |
      | 8. Notificar API com ItemId                            |                         |
      |-------------------------->|                            |                         |
      |                           | 9. Salvar Item + Sync Inicial                        |
      |                           |--------------------------->|                         |
      |                           | 10. Gravar no Firestore    |                         |
      |                           | (families/{id}/accounts)   |                         |
```

---

## 3. Estrutura de Endpoints (`apps/api/src/modules/open-finance`)

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/v1/open-finance/connect-token` | Bearer (Firebase ID Token) | Gera token efêmero para abrir o widget de conexão do provedor |
| `POST` | `/v1/open-finance/items` | Bearer (Firebase ID Token) | Registra um banco conectado (`itemId`), associando à família e ao membro |
| `POST` | `/v1/open-finance/sync/:itemId` | Bearer (Firebase ID Token) | Força a sincronização e importação de transações recentes (últimos 90 dias) |
| `DELETE` | `/v1/open-finance/items/:itemId` | Bearer (Firebase ID Token) | Revoga consentimento e desconecta o banco |
| `POST` | `/v1/open-finance/webhook` | Webhook Secret Header | Recebe notificações de novas transações e atualizações de saldo do provedor |

---

## 4. Normalização de Dados e Idempotência

Para evitar duplicação de transações importadas:
- O ID do documento no Firestore é determinístico:  
  `id = "of_" + providerName + "_" + externalTransactionId`
- O `writeBatch` atualiza ou insere com base nesse ID.
- Datas são normalizadas no fuso `America/Sao_Paulo`.
- Valores monetários são convertidos com segurança para centavos inteiros (`amountCents`).
