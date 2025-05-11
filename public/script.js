// Constantes e configurações
const API_BASE_URL = "http://localhost:3000/api";
let processedData = null;
let modelInfo = null;
let trainingHistory = null;
let comparisonResults = null;

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
  renderInitialUI();
});

// Funções de renderização da UI
function renderInitialUI() {
  const appContainer = document.getElementById("app-container");

  const header = document.createElement("header");
  header.className = "app-header";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Análise de Emissões de Gases de Efeito Estufa no Brasil";

  const subtitle = document.createElement("p");
  subtitle.className = "app-subtitle";
  subtitle.textContent =
    "Sistema de Estimativas de Emissões e Remoções de Gases de Efeito Estufa (SEEG)";

  header.appendChild(title);
  header.appendChild(subtitle);

  const dataSection = createSection("data-section", "Processamento de Dados");
  const modelSection = createSection(
    "model-section",
    "Modelo de Machine Learning"
  );
  const resultsSection = createSection(
    "results-section",
    "Resultados e Previsões"
  );

  const dataButton = document.createElement("button");
  dataButton.className = "btn btn-primary";
  dataButton.textContent = "Carregar e Processar Dados";
  dataButton.onclick = loadData;

  const dataSummaryContainer = document.createElement("div");
  dataSummaryContainer.id = "data-summary";

  dataSection.appendChild(dataButton);
  dataSection.appendChild(dataSummaryContainer);

  const trainButton = document.createElement("button");
  trainButton.className = "btn btn-primary";
  trainButton.textContent = "Treinar Modelo";
  trainButton.id = "train-button";
  trainButton.disabled = true;
  trainButton.onclick = trainModel;

  const trainingParams = document.createElement("div");
  trainingParams.className = "card";
  trainingParams.innerHTML = `
    <h3>Parâmetros de Treinamento</h3>
    <div style="margin: 15px 0;">
      <label for="epochs">Épocas: </label>
      <input type="number" id="epochs" value="100" min="10" max="500">
    </div>
    <div style="margin: 15px 0;">
      <label for="batch-size">Tamanho do Batch: </label>
      <input type="number" id="batch-size" value="32" min="8" max="128">
    </div>
  `;

  const trainingHistoryContainer = document.createElement("div");
  trainingHistoryContainer.id = "training-history";
  trainingHistoryContainer.style.display = "none";

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";
  chartContainer.innerHTML = '<canvas id="training-chart"></canvas>';

  trainingHistoryContainer.appendChild(chartContainer);

  modelSection.appendChild(trainingParams);
  modelSection.appendChild(trainButton);
  modelSection.appendChild(trainingHistoryContainer);

  const predictButton = document.createElement("button");
  predictButton.className = "btn btn-primary";
  predictButton.textContent = "Gerar Previsões";
  predictButton.id = "predict-button";
  predictButton.disabled = true;
  predictButton.onclick = generatePredictions;

  const predictionsContainer = document.createElement("div");
  predictionsContainer.id = "predictions-container";

  resultsSection.appendChild(predictButton);
  resultsSection.appendChild(predictionsContainer);

  appContainer.appendChild(header);
  appContainer.appendChild(dataSection);
  appContainer.appendChild(modelSection);
  appContainer.appendChild(resultsSection);
}

function createSection(id, title) {
  const section = document.createElement("section");
  section.className = "section";
  section.id = id;

  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = title;

  section.appendChild(sectionTitle);
  return section;
}

function showLoader(containerId) {
  const container = document.getElementById(containerId);
  const loader = document.createElement("div");
  loader.className = "loader";
  loader.innerHTML = '<div class="loader-spinner"></div><p>Processando...</p>';
  loader.id = `${containerId}-loader`;
  container.appendChild(loader);
}

function hideLoader(containerId) {
  const loader = document.getElementById(`${containerId}-loader`);
  if (loader) {
    loader.remove();
  }
}

function showAlert(containerId, message, type = "error") {
  const container = document.getElementById(containerId);
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  // Remove alertas anteriores
  const existingAlerts = container.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  container.prepend(alert);

  // Auto-remover depois de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Funções de API
async function loadData() {
  const dataSummary = document.getElementById("data-summary");

  try {
    showLoader("data-summary");

    const response = await fetch(`${API_BASE_URL}/data`);
    if (!response.ok) {
      throw new Error("Falha ao carregar os dados");
    }

    processedData = await response.json();
    hideLoader("data-summary");

    // Ativar botão de treinamento
    document.getElementById("train-button").disabled = false;

    // Mostrar resumo dos dados
    renderDataSummary(processedData);

    showAlert("data-summary", "Dados processados com sucesso!", "success");
  } catch (error) {
    hideLoader("data-summary");
    showAlert("data-summary", `Erro: ${error.message}`);
    console.error("Erro ao processar dados:", error);
  }
}

async function trainModel() {
  try {
    const epochs = parseInt(document.getElementById("epochs").value, 10);
    const batchSize = parseInt(document.getElementById("batch-size").value, 10);

    if (isNaN(epochs) || epochs <= 0 || isNaN(batchSize) || batchSize <= 0) {
      throw new Error("Épocas e tamanho do batch devem ser números positivos");
    }

    showLoader("training-history");
    document.getElementById("train-button").disabled = true;

    console.log(
      `Enviando requisição com epochs=${epochs}, batchSize=${batchSize}`
    );

    const response = await fetch(`${API_BASE_URL}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ epochs, batchSize }),
    });

    if (!response.ok) {
      throw new Error("Falha ao treinar o modelo");
    }

    const result = await response.json();
    hideLoader("training-history");

    trainingHistory = result.trainingHistory;
    modelInfo = result.modelInfo;

    // Mostrar histórico de treinamento
    document.getElementById("training-history").style.display = "block";
    renderTrainingChart(trainingHistory);
    renderModelInfo(modelInfo);

    // Ativar botão de predição
    document.getElementById("predict-button").disabled = false;
    document.getElementById("train-button").disabled = false;

    showAlert("training-history", "Modelo treinado com sucesso!", "success");
  } catch (error) {
    hideLoader("training-history");
    document.getElementById("train-button").disabled = false;
    showAlert("training-history", `Erro: ${error.message}`);
    console.error("Erro ao treinar modelo:", error);
  }
}

async function generatePredictions() {
  try {
    showLoader("predictions-container");

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generateFuture: true }),
    });

    if (!response.ok) {
      throw new Error("Falha ao gerar previsões");
    }

    const result = await response.json();
    hideLoader("predictions-container");

    comparisonResults = result;

    // Mostrar resultados
    renderPredictionResults(result);

    showAlert(
      "predictions-container",
      "Previsões geradas com sucesso!",
      "success"
    );
  } catch (error) {
    hideLoader("predictions-container");
    showAlert("predictions-container", `Erro: ${error.message}`);
    console.error("Erro ao fazer previsões:", error);
  }
}

// Funções de renderização de componentes
function renderDataSummary(data) {
  const container = document.getElementById("data-summary");

  const summaryCard = document.createElement("div");
  summaryCard.className = "card";

  const summary = data.summary;

  summaryCard.innerHTML = `
    <h3>Resumo dos Dados</h3>
    <p>Total de registros: <span class="stat-badge">${
      summary.totalRecords || summary.sampleSize
    }</span></p>
    <p>Features selecionadas: ${data.features
      .map((f) => `<span class="stat-badge">${f}</span>`)
      .join(" ")}</p>
    <p>Variável alvo: <span class="stat-badge">${data.target}</span></p>
    
    <p class="note">* Estatísticas baseadas em amostra para melhor performance</p>
    
    <h4 style="margin-top:18px">Amostra de Dados</h4>
    <div style="overflow-x:auto;">
      ${createSampleDataTable(summary.sampleData)}
    </div>
    
    <h4 style="margin-top:18px">Estatísticas Numéricas</h4>
    ${createStatsTable(summary.numericStats)}
  `;

  // Limpar conteúdo anterior exceto loader e alertas
  Array.from(container.children).forEach((child) => {
    if (
      !child.classList.contains("loader") &&
      !child.classList.contains("alert")
    ) {
      child.remove();
    }
  });

  container.appendChild(summaryCard);
}

function createSampleDataTable(sampleData) {
  if (!sampleData || sampleData.length === 0)
    return "<p>Sem dados de amostra disponíveis</p>";

  const columns = Object.keys(sampleData[0]);

  let tableHtml = "<table><thead><tr>";
  columns.forEach((col) => {
    tableHtml += `<th>${col}</th>`;
  });
  tableHtml += "</tr></thead><tbody>";

  sampleData.forEach((row) => {
    tableHtml += "<tr>";
    columns.forEach((col) => {
      tableHtml += `<td>${row[col] !== null ? row[col] : "N/A"}</td>`;
    });
    tableHtml += "</tr>";
  });

  tableHtml += "</tbody></table>";
  return tableHtml;
}

function createStatsTable(stats) {
  if (!stats || Object.keys(stats).length === 0)
    return "<p>Sem estatísticas disponíveis</p>";

  let tableHtml =
    "<table><thead><tr><th>Feature</th><th>Min</th><th>Máx</th><th>Média</th><th>Contagem</th></tr></thead><tbody>";

  Object.entries(stats).forEach(([feature, stat]) => {
    tableHtml += `<tr>
      <td>${feature}</td>
      <td>${stat.min !== undefined ? stat.min.toFixed(2) : "N/A"}</td>
      <td>${stat.max !== undefined ? stat.max.toFixed(2) : "N/A"}</td>
      <td>${stat.mean !== undefined ? stat.mean.toFixed(2) : "N/A"}</td>
      <td>${stat.count !== undefined ? stat.count : "N/A"}</td>
    </tr>`;
  });

  tableHtml += "</tbody></table>";
  return tableHtml;
}

function renderTrainingChart(historyData) {
  const ctx = document.getElementById("training-chart").getContext("2d");

  // Criar dados para o gráfico
  const epochs = historyData.map((entry) => entry.epoch);
  const trainLoss = historyData.map((entry) => entry.loss);
  const valLoss = historyData.map((entry) => entry.val_loss);

  // Destruir gráfico existente se houver
  Chart.getChart("training-chart")?.destroy();

  new Chart(ctx, {
    type: "line",
    data: {
      labels: epochs,
      datasets: [
        {
          label: "Loss (Treino)",
          data: trainLoss,
          borderColor: "rgba(30, 136, 229, 0.8)",
          backgroundColor: "rgba(30, 136, 229, 0.1)",
          tension: 0.1,
          borderWidth: 2,
        },
        {
          label: "Loss (Validação)",
          data: valLoss,
          borderColor: "rgba(255, 87, 34, 0.8)",
          backgroundColor: "rgba(255, 87, 34, 0.1)",
          tension: 0.1,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Evolução do Treinamento",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Época",
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: "Loss",
          },
        },
      },
    },
  });
}

function renderModelInfo(info) {
  const container = document.getElementById("training-history");

  const infoCard = document.createElement("div");
  infoCard.className = "card";
  infoCard.innerHTML = `
    <h3>Arquitetura do Modelo</h3>
    <table>
      <thead>
        <tr>
          <th>Camada</th>
          <th>Tipo</th>
          <th>Unidades</th>
          <th>Ativação</th>
        </tr>
      </thead>
      <tbody>
        ${info.layers
          .map(
            (layer) => `
          <tr>
            <td>${layer.name}</td>
            <td>${layer.type}</td>
            <td>${layer.units || "N/A"}</td>
            <td>${layer.activation || "N/A"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <p style="margin-top:15px">Otimizador: <strong>${
      info.optimizer
    }</strong></p>
    <p>Função de perda: <strong>${info.loss}</strong></p>
  `;

  container.appendChild(infoCard);
}

function renderPredictionResults(results) {
  const container = document.getElementById("predictions-container");

  // Limpar conteúdo anterior
  Array.from(container.children).forEach((child) => {
    if (
      !child.classList.contains("loader") &&
      !child.classList.contains("alert")
    ) {
      child.remove();
    }
  });

  // Métricas
  const metricsCard = document.createElement("div");
  metricsCard.className = "card";

  if (results.comparison && results.comparison.metrics) {
    const metrics = results.comparison.metrics;
    metricsCard.innerHTML = `
      <h3>Métricas de Avaliação</h3>
      <p>MSE (Erro Quadrático Médio): <strong>${metrics.mse.toFixed(
        4
      )}</strong></p>
      <p>MAE (Erro Absoluto Médio): <strong>${metrics.mae.toFixed(
        4
      )}</strong></p>
      <p>RMSE (Raiz do Erro Quadrático Médio): <strong>${metrics.rmse.toFixed(
        4
      )}</strong></p>
    `;
  } else {
    metricsCard.innerHTML = `<h3>Métricas de Avaliação</h3><p>Métricas não disponíveis</p>`;
  }

  container.appendChild(metricsCard);

  // Gráfico de comparação
  if (results.comparison && results.comparison.comparison) {
    const comparisonData = results.comparison.comparison;

    const comparisonChartContainer = document.createElement("div");
    comparisonChartContainer.className = "chart-container";
    comparisonChartContainer.innerHTML =
      '<canvas id="comparison-chart"></canvas>';

    container.appendChild(comparisonChartContainer);

    // Criar dados para o gráfico
    const indices = comparisonData.map((_, i) => i + 1);
    const actual = comparisonData.map((item) => item.actual);
    const predicted = comparisonData.map((item) => item.predicted);

    const ctx = document.getElementById("comparison-chart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: indices,
        datasets: [
          {
            label: "Valores Reais",
            data: actual,
            borderColor: "rgba(30, 136, 229, 0.8)",
            backgroundColor: "transparent",
            pointRadius: 4,
            borderWidth: 2,
          },
          {
            label: "Valores Preditos",
            data: predicted,
            borderColor: "rgba(255, 87, 34, 0.8)",
            backgroundColor: "transparent",
            pointRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Comparação: Valores Reais vs. Preditos",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        hover: {
          mode: "nearest",
          intersect: true,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Índice",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Emissão",
            },
          },
        },
      },
    });
  }

  // Previsões futuras
  if (results.futurePredictions && results.futurePredictions.length > 0) {
    const futureCard = document.createElement("div");
    futureCard.className = "card";

    futureCard.innerHTML = `
      <h3>Previsões Futuras</h3>
      <p>Projeção de emissões para os próximos anos:</p>
    `;

    const futureChartContainer = document.createElement("div");
    futureChartContainer.className = "chart-container";
    futureChartContainer.innerHTML = '<canvas id="future-chart"></canvas>';

    futureCard.appendChild(futureChartContainer);
    container.appendChild(futureCard);

    // Criar dados para o gráfico
    const years = results.futurePredictions.map((item) => item.year);
    const predictions = results.futurePredictions.map(
      (item) => item.prediction
    );

    const ctx = document.getElementById("future-chart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: [
          {
            label: "Emissões Previstas",
            data: predictions,
            borderColor: "rgba(76, 175, 80, 0.8)",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            tension: 0.3,
            fill: true,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Previsão de Emissões Futuras",
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Ano",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Emissão Prevista",
            },
          },
        },
      },
    });
  }
}
