# data-model.md — Modelo de Dados Firestore, Isolamento Familiar e Offline-First

> **Projeto:** Partiu Invest  
> **Banco:** Cloud Firestore (Plano Spark / Gratuito)  
> **Público:** Agente de desenvolvimento Gemini Antigravity e Engenharia de Software.

---

## 1. Arquitetura de Isolamento Multi-usuário Familiar

Todo o sistema é particionado por família. Cada chefe de família possui um documento raiz na coleção `families`. Todos os dados pertencentes à família e seus membros residem em subcoleções abaixo de `families/{familyId}`.

```
firestore/
├─ families/{familyId}                      # Documento raiz da família (Chefe de Família)
│  ├─ members/{memberId}                   # Membros: Chefe, Cônjuge, Filhos
│  ├─ accounts/{accountId}                 # Contas bancárias (manuais ou Open Finance)
│  ├─ boxes/{boxId}                        # Caixinhas de reserva, sonhos e metas
│  ├─ boxMovements/{movementId}            # Movimentações e aportes em caixinhas (Ledger)
│  ├─ transactions/{transactionId}         # Transações financeiras (entradas, saídas, despesas)
│  ├─ planning/{period}                    # Orçamento mensal consolidado e por categoria (ex: "2026-09")
│  ├─ summaries/{summaryId}                # Documentos de agregados pré-calculados (economiza cotas)
│  ├─ consents/{consentId}                 # Registro de consentimentos LGPD e Open Finance
│  └─ auditLogs/{logId}                    # Trilha de auditoria (escrita restrita à API Node)
└─ invites/{inviteTokenHash}               # Tokens efêmeros de convite de novos membros
```

---

## 2. Estrutura dos Documentos

### 2.1 Família (`families/{familyId}`)
```json
{
  "id": "fam_xyz123",
  "name": "Família Silva",
  "headMemberId": "mem_chefe_01",
  "createdAt": "2026-09-20T21:00:00Z",
  "updatedAt": "2026-09-20T21:00:00Z",
  "plan": "free",
  "currency": "BRL",
  "settings": {
    "defaultView": "consolidated",
    "allowKidsViewFamilyTotals": true
  }
}
```

### 2.2 Membros (`families/{familyId}/members/{memberId}`)
```json
{
  "id": "mem_chefe_01",
  "authUid": "firebase_auth_uid_123",
  "role": "chefe-familia", // "chefe-familia" | "conjuge" | "filho"
  "name": "Lucas Martins",
  "displayName": "Lucas",
  "email": "lucas@example.com",
  "avatarUrl": "https://...",
  "color": "#F5B82E",
  "isMinor": false,
  "status": "active", // "active" | "invited" | "revoked"
  "createdAt": "2026-09-20T21:00:00Z",
  "updatedAt": "2026-09-20T21:00:00Z"
}
```

### 2.3 Contas Bancárias (`families/{familyId}/accounts/{accountId}`)
```json
{
  "id": "acc_nubank_01",
  "ownerMemberId": "mem_chefe_01",
  "visibility": "family", // "family" (todos veem) | "private" (só o dono e chefe)
  "name": "Nubank Conta Principal",
  "type": "checking", // "checking" | "savings" | "credit_card" | "investment"
  "source": "open_finance", // "manual" | "open_finance" | "ofx"
  "openFinanceItemId": "item_pluggy_987",
  "balanceCents": 1250050, // R$ 12.500,50 (sempre inteiro)
  "color": "#8A05BE",
  "institutionName": "Nu Pagamentos S.A.",
  "lastSyncedAt": "2026-09-20T21:30:00Z",
  "deletedAt": null
}
```

### 2.4 Caixinhas / Metas (`families/{familyId}/boxes/{boxId}`)
```json
{
  "id": "box_reserva_01",
  "ownerMemberId": "mem_chefe_01",
  "visibility": "family",
  "name": "Reserva de Emergência",
  "category": "emergency", // "emergency" | "dream" | "investment" | "education"
  "targetAmountCents": 3000000, // R$ 30.000,00
  "currentBalanceCents": 1540000, // R$ 15.400,00
  "targetDate": "2027-12-31",
  "color": "#F5B82E",
  "icon": "shield-check",
  "deletedAt": null
}
```

### 2.5 Transações (`families/{familyId}/transactions/{transactionId}`)
```json
{
  "id": "tx_20260920_001",
  "accountId": "acc_nubank_01",
  "memberId": "mem_chefe_01", // Quem realizou o gasto/receita
  "visibility": "family", // "family" | "private"
  "description": "Supermercado Pão de Açúcar",
  "amountCents": -34250, // Saída de R$ 342,50
  "category": "alimentacao",
  "subCategory": "mercado",
  "date": "2026-09-20",
  "competencePeriod": "2026-09",
  "source": "open_finance",
  "externalId": "of_pluggy_tx_888",
  "createdAt": "2026-09-20T21:00:00Z",
  "updatedAt": "2026-09-20T21:00:00Z",
  "deletedAt": null
}
```

---

## 3. Diretrizes de Suporte Offline-First

1. **Geração de IDs no Cliente:** Utiliza `doc(collection(db, ...)).id` antes da escrita para possibilitar referências cruzadas imediatas sem conexão.
2. **Escrita sem Bloqueio (`writeBatch`):** Transações que exigem múltiplos registros (ex: transferência entre caixinhas) usam lotes (`writeBatch`) que são aceitos offline pelo Firestore SDK e enviados na retomada da conexão.
3. **Controle de Saldos Concorrentes:** Usar `increment(deltaCents)` para atualizar `balanceCents`, evitando perda de dados caso múltiplos membros façam lançamentos sem internet simultaneamente.
4. **Exclusão Lógica (`deletedAt`):** Nunca usar `deleteDoc` em documentos principais; preencher `deletedAt: Timestamp` para que a sincronização propague a remoção entre dispositivos.

---

## 4. Matriz de Segurança do Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Função auxiliar para autenticação
    function isAuthenticated() {
      return request.auth != null;
    }

    // Função para verificar se o usuário pertence à família
    function isFamilyMember(familyId) {
      return isAuthenticated() && request.auth.token.familyId == familyId;
    }

    // Função para checar se é o chefe da família
    function isFamilyHead(familyId) {
      return isFamilyMember(familyId) && request.auth.token.role == 'chefe-familia';
    }

    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow create, update, delete: if isFamilyHead(familyId);

      match /members/{memberId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyHead(familyId) || (isFamilyMember(familyId) && request.auth.token.memberId == memberId);
      }

      match /accounts/{accountId} {
        allow read: if isFamilyMember(familyId) && (
          resource.data.visibility == 'family' || 
          resource.data.ownerMemberId == request.auth.token.memberId ||
          isFamilyHead(familyId)
        );
        allow write: if isFamilyMember(familyId) && (
          resource == null || resource.data.ownerMemberId == request.auth.token.memberId || isFamilyHead(familyId)
        );
      }

      match /boxes/{boxId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyMember(familyId);
      }

      match /transactions/{transactionId} {
        allow read: if isFamilyMember(familyId) && (
          resource.data.visibility == 'family' || 
          resource.data.memberId == request.auth.token.memberId ||
          isFamilyHead(familyId)
        );
        allow write: if isFamilyMember(familyId) && (
          resource == null || resource.data.memberId == request.auth.token.memberId || isFamilyHead(familyId)
        );
      }

      match /summaries/{summaryId} {
        allow read: if isFamilyMember(familyId);
        allow write: if false; // Apenas API Node / Admin SDK
      }
    }
  }
}
```
