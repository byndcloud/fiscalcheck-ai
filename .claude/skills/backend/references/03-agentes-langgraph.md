# 03 — Agentes LangGraph (human-in-the-loop)

> Decisão de stack em [`ADR-0001`](../../../../docs/adr/0001-stack-inicial.md). Cada agente vive em [`apps/api/src/fiscalcheck_api/agents/<nome>/graph.py`](../../../../apps/api/src/fiscalcheck_api/agents/).

## 1. Por que LangGraph

Máquinas de estado explícitas + **human-in-the-loop nativo** (interrupção, espera, retomada). Crucial porque o auditor é o decisor — agentes preparam, recomendam, instruem; nunca executam ações com efeito sobre o contribuinte sozinhos.

## 2. Princípios

1. **Estado tipado** — `State` é um `TypedDict` ou Pydantic. Sem dicionários soltos.
2. **Checkpointing** — sempre usar checkpointer (Postgres em produção, in-memory em dev) para que o agente possa pausar e ser retomado pelo auditor.
3. **Interrupt antes de ação efetiva** — qualquer node que tenha efeito sobre o contribuinte (intimação, notificação, abertura de fiscalização) chama `interrupt()` para esperar aprovação humana.
4. **Logging com `correlation_id`** — propagar pelo state e logar em cada node.
5. **Pseudonimização antes de LLM externo** — qualquer node que chama OpenAI/Anthropic recebe payload com PII já hash-eada.
6. **Tools são funções puras quando possível** — testáveis isoladamente; side effects ficam em nodes específicos.

## 3. Esqueleto de agente

```python
# agents/triage_assistant/graph.py
"""Agente de triagem assistida.

Recebe um caso candidato (saída do módulo 2), enriquece com sinais
do módulo 3 (score + XAI) e propõe próxima ação. NÃO executa — apenas
recomenda. A decisão final é do auditor (nó human-in-the-loop).
"""

from typing import Literal, TypedDict
from uuid import UUID

from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, StateGraph
from langgraph.types import interrupt

from fiscalcheck_api.core.logging import get_logger
from fiscalcheck_api.core.security import pseudonymize

logger = get_logger(__name__)


class TriageState(TypedDict):
    case_id: UUID
    taxpayer_hash: str  # já pseudonimizado
    correlation_id: str
    risk_signals: list[dict]
    recommended_action: Literal["follow_up", "open_case", "dismiss"] | None
    auditor_decision: Literal["approve", "reject", "more_info"] | None


def fetch_signals(state: TriageState) -> TriageState:
    """Coleta sinais do módulo 2 (cruzamento) e módulo 3 (score)."""
    logger.info("triage.fetch_signals", correlation_id=state["correlation_id"])
    # ... query DB ...
    return state


def recommend(state: TriageState) -> TriageState:
    """Aplica heurísticas/LLM para sugerir próxima ação."""
    logger.info("triage.recommend", correlation_id=state["correlation_id"])
    # ... lógica + LLM chamado com PAYLOAD JÁ PSEUDONIMIZADO ...
    return {**state, "recommended_action": "follow_up"}


def await_auditor(state: TriageState) -> TriageState:
    """Interrupt — espera decisão do auditor.

    O agente para aqui. O frontend exibe a recomendação e oferece os
    botões de decisão. Ao receber a decisão, o orquestrador retoma o
    grafo com `auditor_decision` preenchido.
    """
    decision = interrupt({
        "type": "auditor_decision_required",
        "case_id": str(state["case_id"]),
        "recommended_action": state["recommended_action"],
    })
    return {**state, "auditor_decision": decision}


def apply_decision(state: TriageState) -> TriageState:
    """Aplica a decisão. Só roda DEPOIS do interrupt."""
    logger.info(
        "triage.apply_decision",
        correlation_id=state["correlation_id"],
        decision=state["auditor_decision"],
    )
    # ... persiste no audit log com auditor_id + timestamp ...
    return state


def build_graph(checkpointer: PostgresSaver):
    g = StateGraph(TriageState)
    g.add_node("fetch_signals", fetch_signals)
    g.add_node("recommend", recommend)
    g.add_node("await_auditor", await_auditor)
    g.add_node("apply_decision", apply_decision)

    g.set_entry_point("fetch_signals")
    g.add_edge("fetch_signals", "recommend")
    g.add_edge("recommend", "await_auditor")
    g.add_edge("await_auditor", "apply_decision")
    g.add_edge("apply_decision", END)

    return g.compile(checkpointer=checkpointer)
```

## 4. Invocação a partir do FastAPI

```python
# modules/cases/router.py (trecho)
from langgraph.checkpoint.postgres import PostgresSaver

from fiscalcheck_api.agents.triage_assistant.graph import build_graph


@router.post("/triage/{case_id}")
async def start_triage(case_id: UUID, request: Request) -> dict:
    checkpointer = PostgresSaver.from_conn_string(settings.database_url_sync)
    graph = build_graph(checkpointer)
    thread_id = f"triage-{case_id}"

    result = await graph.ainvoke(
        {
            "case_id": case_id,
            "taxpayer_hash": pseudonymize(str(case_id)),  # exemplo
            "correlation_id": request.state.correlation_id,
            "risk_signals": [],
            "recommended_action": None,
            "auditor_decision": None,
        },
        config={"configurable": {"thread_id": thread_id}},
    )
    return {"thread_id": thread_id, "state": result}
```

## 5. Retomada após decisão humana

```python
@router.post("/triage/{thread_id}/resume")
async def resume_triage(thread_id: str, decision: str) -> dict:
    graph = build_graph(checkpointer)
    return await graph.ainvoke(
        Command(resume=decision),
        config={"configurable": {"thread_id": thread_id}},
    )
```

O `thread_id` é a chave que liga uma execução pausada à retomada. Persistido pelo checkpointer.

## 6. Tools (quando o agente precisa chamar funções)

```python
from langchain_core.tools import tool


@tool
def consultar_grafo_socios(taxpayer_hash: str) -> list[str]:
    """Retorna sócios em comum (apenas hashes — sem PII)."""
    # ... implementação ...
    return []
```

Tools recebem **hashes**, retornam **hashes**. PII descriptografada/des-hash-eada só no momento de renderizar para o auditor.

## 7. Testes

- **Nó isolado**: cada node é função pura (entrada `State`, saída `State`). Teste com `unittest.mock` para LLM calls.
- **Grafo completo**: use `MemorySaver` (in-memory checkpointer), simule input do auditor, verifique a sequência de nodes executados (`graph.get_state(config).next`).
- **Eval LLM**: para nodes que chamam LLM, dataset curado de casos com saída esperada (intervalo).

## 8. Anti-padrões

- ❌ Agente que executa ação efetiva (chamar Twilio, salvar `case.status = 'open'`) **sem** passar por `interrupt`.
- ❌ State com PII em texto claro (`cnpj`, `valor_total`) — sempre hash quando trafegar entre nodes ou para LLM externo.
- ❌ Usar `MemorySaver` em produção — perde estado ao reiniciar.
- ❌ Tool decorada com `@tool` que faz I/O bloqueante em endpoint async — converta para `async` ou use `sync_to_async`.
- ❌ Logar payload de mensagem de LLM no nível `INFO` (`logger.info("prompt", messages=...)`) — pode conter PII de tools chamadas.
- ❌ `correlation_id` não propagado entre nodes — quebra cadeia de custódia.
