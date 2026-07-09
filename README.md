# Solution Kitchen — KDS (Kitchen Display System)

Frontend web (React + TypeScript + Vite) usado pela cozinha — tela única mostrando os pedidos pendentes em tempo real, com contadores por status e ação de avançar status.

## Responsabilidades

- Autenticação via Auth0, restrita aos papéis `chef` e `gerente` (diferente do `app-garcoom`, que usa `garcom`/`gerente`)
- Exibir pedidos pendentes em cards, agrupados visualmente por status (`Pending`, `Preparing`, `Ready`) com contadores no header
- Avançar o status de um pedido (`updateStatus`) — atualização otimista na tela, seguida da chamada real pro `bff-cozinha`
- Manter conexão SignalR em tempo real com o `bff-cozinha`, com reconexão automática

**O que este app NÃO faz:**
- Não mostra pedidos entregues (`Delivered`) — eles somem da lista assim que o backend os remove da fila de trabalho (ver README do `kitchen-service`)
- Não fala com nenhum serviço diretamente — tudo passa pelo `bff-cozinha`
- Não tem gestão de mesas, cardápio ou pagamento — é uma tela de trabalho only, focada na cozinha

## Stack

- React 19 + TypeScript + Vite
- Auth0 (`@auth0/auth0-react`)
- `@microsoft/signalr` (client)
- Tailwind CSS
- Sem Zustand/Redux — estado dos pedidos vive inteiro dentro do hook `useKitchenOrders`, sem store global

## Rodando localmente

```bash
npm install
npm run dev
```

Variável de ambiente esperada: `VITE_BFF_COZINHA_URL` (default `http://localhost:5164`), além das configs do Auth0 em `main.tsx` (não auditado nesta sessão, mesma ressalva do `app-garcoom`).

Porta local: `5175` (mapeada no docker-compose; internamente servido via Nginx na porta `80`).

## Arquitetura

**SignalR é o caminho real de atualização — não é `fetch` disfarçado.** ⚠️ Correção de uma suposição registrada incorretamente em sessão anterior (nos READMEs do `kitchen-service` e `bff-cozinha`): `kitchenSignalRService.ts` usa SignalR de verdade (`HubConnectionBuilder`, conecta em `/hubs/kitchen` do `bff-cozinha`, escuta o evento `KitchenOrdersUpdated`, reconexão automática com backoff `[0, 2000, 5000, 10000]`ms). O `fetch` que existe dentro dele (`fetchAndNotify`) é só uma **busca inicial única**, chamada uma vez logo após conectar — popula a tela antes do primeiro evento chegar, não substitui o SignalR.

**Atualização otimista de status.** `useKitchenOrders.updateStatus()` atualiza o estado local **antes** de confirmar com o backend (`setOrders` roda antes do `await kitchenService.updateStatus(...)`). Se a chamada falhar, o erro só vai pro console — a tela não reverte visualmente. Trade-off consciente pra UI responsiva; ponto de atenção se aparecer inconsistência entre o que a tela mostra e o que o backend realmente tem.

**Sem "tempo de graça" pra pedidos prontos.** Uma versão anterior mantinha pedidos com status `Ready` visíveis na tela por mais 8 segundos após a marcação (e mesclava a lista nova do SignalR com esses pedidos "segurados"). Essa lógica foi removida deliberadamente — hoje a tela reflete exatamente o que o backend informa, sem atraso proposital.

**Normalização de casing em `mapOrder()`.** O hook aceita tanto PascalCase (`OrderId`) quanto camelCase (`orderId`) vindo da API — `raw.OrderId ?? raw.orderId`, repetido campo por campo. Sinal de que em algum momento o formato de serialização mudou (ou varia entre o path do SignalR e o do REST) e essa função foi a forma de absorver a inconsistência, em vez de corrigir na origem.

## Gotchas conhecidos

- **✅ Corrigido em 09/07 — fallback de tenant sem proteção de ambiente.** Mesmo padrão já corrigido no `app-garcoom`: `App.tsx` usava o tenant de dev como fallback incondicional. Corrigido: fallback só existe com `import.meta.env.DEV`; em produção sem a claim `tenant_id`, mostra tela "Conta sem restaurante vinculado". Testado em dev e via Docker (porta 5175).
- **Papel `chef`, não `garcom`.** Ao configurar usuários no Auth0 pra acesso ao KDS, a claim de role precisa incluir `chef` (ou `gerente`) — usar `garcom`