const estado = {
  cursos: [
    { nome: "Python Básico",        ganho: 6,  horas: 4, nivel: 1 },
    { nome: "Banco de Dados",       ganho: 7,  horas: 5, nivel: 2 },
    { nome: "Estruturas de Dados",  ganho: 9,  horas: 6, nivel: 3 },
    { nome: "Machine Learning",     ganho: 10, horas: 8, nivel: 5 },
    { nome: "Engenharia de Software", ganho: 8, horas: 4, nivel: 4 },
  ],
};

const formCurso     = document.getElementById("formCurso");
const inputNome     = document.getElementById("inputNome");
const inputGanho    = document.getElementById("inputGanho");
const inputHoras    = document.getElementById("inputHoras");
const inputNivel    = document.getElementById("inputNivel");
const listaCursos   = document.getElementById("listaCursos");
const contadorCursos = document.getElementById("contadorCursos");
const inputLimite   = document.getElementById("inputLimite");
const btnGerar      = document.getElementById("btnGerar");
const areaResultado = document.getElementById("areaResultado");
const toast         = document.getElementById("toast");

function inicializar() {
  renderizarListaCursos();
  formCurso.addEventListener("submit", adicionarCurso);
  btnGerar.addEventListener("click", gerarRecomendacao);
}

function renderizarListaCursos() {
  contadorCursos.textContent = estado.cursos.length;

  if (estado.cursos.length === 0) {
    listaCursos.innerHTML = `
      <div class="lista-vazia">
        📚 Nenhum curso cadastrado ainda.<br>
        Adicione cursos pelo formulário acima.
      </div>`;
    return;
  }

  listaCursos.innerHTML = estado.cursos.map((curso, idx) => `
    <div class="curso-item">
      <div class="curso-nivel">${curso.nivel}</div>
      <div class="curso-info">
        <div class="curso-nome">${escapeHtml(curso.nome)}</div>
        <div class="curso-meta">
          ⭐ ${curso.ganho} ganho &nbsp;·&nbsp; 🕐 ${curso.horas}h
        </div>
      </div>
      <button class="btn btn-outline" onclick="removerCurso(${idx})" title="Remover">
        ✕
      </button>
    </div>
  `).join("");
}

function adicionarCurso(e) {
  e.preventDefault();

  const nome  = inputNome.value.trim();
  const ganho = parseInt(inputGanho.value);
  const horas = parseInt(inputHoras.value);
  const nivel = parseInt(inputNivel.value);

  if (!nome) return mostrarToast("Informe o nome do curso.", "erro");
  if (!ganho || ganho < 1) return mostrarToast("Ganho deve ser ≥ 1.", "erro");
  if (!horas || horas < 1) return mostrarToast("Duração deve ser ≥ 1h.", "erro");
  if (!nivel || nivel < 1 || nivel > 10) return mostrarToast("Nível deve ser entre 1 e 10.", "erro");

  const jáExiste = estado.cursos.some(
    c => c.nome.toLowerCase() === nome.toLowerCase()
  );
  if (jáExiste) return mostrarToast("Já existe um curso com esse nome.", "erro");

  estado.cursos.push({ nome, ganho, horas, nivel });
  renderizarListaCursos();
  formCurso.reset();
  mostrarToast(`"${nome}" adicionado!`, "sucesso");
}

function removerCurso(idx) {
  const nome = estado.cursos[idx].nome;
  estado.cursos.splice(idx, 1);
  renderizarListaCursos();
  mostrarToast(`"${nome}" removido.`);
}

async function gerarRecomendacao() {
  const limiteHoras = parseInt(inputLimite.value);

  if (!limiteHoras || limiteHoras < 1) {
    return mostrarToast("Informe o limite de horas disponíveis.", "erro");
  }

  if (estado.cursos.length === 0) {
    return mostrarToast("Adicione pelo menos um curso.", "erro");
  }

  btnGerar.classList.add("carregando");
  btnGerar.textContent = "Calculando...";

  try {
    const resposta = await fetch("/api/recomendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cursos: estado.cursos,
        limiteHoras: limiteHoras,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return mostrarToast(dados.erro || "Erro ao processar.", "erro");
    }

    renderizarResultado(dados);
    mostrarToast("Recomendação gerada com sucesso!", "sucesso");

  } catch (err) {
    mostrarToast("Erro de conexão com o servidor.", "erro");
    console.error(err);
  } finally {
    btnGerar.classList.remove("carregando");
    btnGerar.textContent = "⚡ Gerar recomendação";
  }
}

function renderizarResultado(dados) {
  const { knapsack, lis, limiteHoras } = dados;
  const percentualHoras = Math.round((knapsack.totalHoras / limiteHoras) * 100);

  let htmlSelecionados = "";
  if (knapsack.selecionados.length === 0) {
    htmlSelecionados = `<p style="color:var(--cinza-400); font-size:13px;">
      Nenhum curso cabe no limite de horas informado.
    </p>`;
  } else {
    htmlSelecionados = `<div class="chips-lista">
      ${knapsack.selecionados.map(c => `
        <span class="chip chip-azul">
          <span>${escapeHtml(c.nome)}</span>
          <span style="opacity:0.6">${c.horas}h</span>
        </span>
      `).join("")}
    </div>`;
  }

  let htmlDescartados = "";
  if (knapsack.descartados.length === 0) {
    htmlDescartados = `<p style="color:var(--cinza-400); font-size:13px;">Todos os cursos foram selecionados.</p>`;
  } else {
    htmlDescartados = `<div class="chips-lista">
      ${knapsack.descartados.map(c => `
        <span class="chip chip-cinza">${escapeHtml(c.nome)}</span>
      `).join("")}
    </div>`;
  }

  let htmlTrilha = "";
  if (lis.trilha.length === 0) {
    htmlTrilha = `<p style="color:var(--cinza-400); font-size:13px;">
      Não foi possível montar uma trilha com os cursos selecionados.
    </p>`;
  } else {
    htmlTrilha = `
      <div class="trilha-lista">
        ${lis.trilha.map((curso, i) => `
          <div class="trilha-item">
            <div class="trilha-num">${i + 1}</div>
            <div class="trilha-info">
              <div class="trilha-nome">${escapeHtml(curso.nome)}</div>
              <div class="trilha-detalhe">⭐ ${curso.ganho} ganho &nbsp;·&nbsp; 🕐 ${curso.horas}h</div>
            </div>
            <span class="nivel-badge">Nível ${curso.nivel}</span>
          </div>
        `).join("")}
      </div>
      <p style="margin-top:12px; font-size:12px; color:var(--cinza-400); line-height:1.6;">
        Os cursos acima seguem uma progressão crescente de dificuldade — você pode cursá-los
        nessa ordem sem lacunas de pré-requisito.
        ${lis.trilha.length < knapsack.selecionados.length
          ? `<br>Os outros ${knapsack.selecionados.length - lis.trilha.length} curso(s) selecionado(s) ficaram fora da trilha por terem nível igual a outro curso.`
          : ""}
      </p>`;
  }

  areaResultado.innerHTML = `
    <div class="resultado-area">

      <!-- Knapsack -->
      <div class="resultado-card knapsack-card">
        <div class="resultado-card-header">
          <div class="icon-label icon-azul">🎒</div>
          <h3>Seleção por Knapsack</h3>
          <div class="stats-row">
            <div class="stat">
              <div class="stat-valor stat-azul">${knapsack.totalGanho}</div>
              <div class="stat-label">ganho total</div>
            </div>
            <div class="stat">
              <div class="stat-valor">${knapsack.totalHoras}h / ${limiteHoras}h</div>
              <div class="stat-label">horas (${percentualHoras}%)</div>
            </div>
          </div>
        </div>
        <div class="resultado-card-body">
          <p style="font-size:12px; color:var(--cinza-400); margin-bottom:10px;">
            ${knapsack.selecionados.length} curso(s) selecionado(s) para maximizar o ganho de conhecimento dentro do limite de ${limiteHoras}h.
          </p>
          ${htmlSelecionados}
        </div>
      </div>

      <!-- LIS -->
      <div class="resultado-card lis-card">
        <div class="resultado-card-header">
          <div class="icon-label icon-verde">📈</div>
          <h3>Trilha de Aprendizado (LIS)</h3>
          <div class="stats-row">
            <div class="stat">
              <div class="stat-valor stat-verde">${lis.trilha.length}</div>
              <div class="stat-label">etapas</div>
            </div>
          </div>
        </div>
        <div class="resultado-card-body">
          ${htmlTrilha}
        </div>
      </div>

      <!-- Descartados -->
      <div class="resultado-card descartado-card">
        <div class="resultado-card-header">
          <div class="icon-label" style="background:var(--cinza-100); color:var(--cinza-400);">🗑️</div>
          <h3>Cursos fora do limite</h3>
        </div>
        <div class="resultado-card-body">
          ${htmlDescartados}
        </div>
      </div>

      <!-- Explicação dos algoritmos -->
      <div class="algo-info">
        <div class="algo-box azul">
          <h4>🎒 Knapsack PD</h4>
          <p>Escolhe os cursos com maior ganho de conhecimento respeitando o limite de horas. Usa uma tabela 2D para avaliar todas as combinações possíveis sem repetição.</p>
        </div>
        <div class="algo-box verde">
          <h4>📈 LIS (Maior Subseq. Crescente)</h4>
          <p>Organiza os cursos selecionados em uma sequência com nível de dificuldade sempre crescente, formando uma trilha de aprendizado sem lacunas.</p>
        </div>
      </div>

    </div>
  `;

  areaResultado.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let toastTimer = null;
function mostrarToast(msg, tipo = "") {
  toast.textContent = msg;
  toast.className = `toast visivel ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

inicializar();
