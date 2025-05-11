(function () {
  // ========== Configurações e estado global ==========
  const API = {
    BASE_URL: "http://localhost:3000/api",

    // Funções de comunicação com a API
    loadData: async function () {
      try {
        UI.showLoader("data-summary");

        const response = await fetch(`${this.BASE_URL}/data`);
        if (!response.ok) {
          throw new Error("Falha ao carregar os dados");
        }

        const data = await response.json();
        App.state.processedData = data;
        UI.hideLoader("data-summary");

        // Ativar botão de treinamento
        document.getElementById("train-button").disabled = false;

        // Mostrar resumo dos dados
        UI.renderDataSummary(data);

        UI.showAlert(
          "data-summary",
          "Dados processados com sucesso!",
          "success"
        );
      } catch (error) {
        UI.hideLoader("data-summary");
        UI.showAlert("data-summary", `Erro: ${error.message}`);
        console.error("Erro ao processar dados:", error);
      }
    },

    trainModel: async function () {
      try {
        const epochs = parseInt(document.getElementById("epochs").value, 10);
        const batchSize = parseInt(
          document.getElementById("batch-size").value,
          10
        );

        if (
          isNaN(epochs) ||
          epochs <= 0 ||
          isNaN(batchSize) ||
          batchSize <= 0
        ) {
          throw new Error(
            "Épocas e tamanho do batch devem ser números positivos"
          );
        }

        UI.showLoader("training-history");
        document.getElementById("train-button").disabled = true;

        console.log(
          `Enviando requisição com epochs=${epochs}, batchSize=${batchSize}`
        );

        const response = await fetch(`${this.BASE_URL}/train`, {
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
        UI.hideLoader("training-history");

        App.state.trainingHistory = result.trainingHistory;
        App.state.modelInfo = result.modelInfo;

        // Mostrar histórico de treinamento
        document.getElementById("training-history").style.display = "block";
        Charts.renderTrainingChart(result.trainingHistory);
        UI.renderModelInfo(result.modelInfo);

        // Ativar botão de predição
        document.getElementById("predict-button").disabled = false;
        document.getElementById("train-button").disabled = false;

        UI.showAlert(
          "training-history",
          "Modelo treinado com sucesso!",
          "success"
        );
      } catch (error) {
        UI.hideLoader("training-history");
        document.getElementById("train-button").disabled = false;
        UI.showAlert("training-history", `Erro: ${error.message}`);
        console.error("Erro ao treinar modelo:", error);
      }
    },

    generatePredictions: async function () {
      try {
        UI.showLoader("predictions-container");

        const response = await fetch(`${this.BASE_URL}/predict`, {
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
        UI.hideLoader("predictions-container");

        App.state.comparisonResults = result;

        // Mostrar resultados
        UI.renderPredictionResults(result);

        UI.showAlert(
          "predictions-container",
          "Previsões geradas com sucesso!",
          "success"
        );
      } catch (error) {
        UI.hideLoader("predictions-container");
        UI.showAlert("predictions-container", `Erro: ${error.message}`);
        console.error("Erro ao fazer previsões:", error);
      }
    },
  };

  // Módulo para gerenciamento da interface
  const UI = {
    showLoader: function (containerId) {
      const container = document.getElementById(containerId);
      const loader = document.createElement("div");
      loader.className = "loader";
      loader.innerHTML =
        '<div class="loader-spinner"></div><p>Processando...</p>';
      loader.id = `${containerId}-loader`;
      container.appendChild(loader);
    },

    hideLoader: function (containerId) {
      const loader = document.getElementById(`${containerId}-loader`);
      if (loader) {
        loader.remove();
      }
    },

    showAlert: function (containerId, message, type = "error") {
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
    },

    renderInitialUI: function () {
      const appContainer = document.getElementById("app-container");

      const header = document.createElement("header");
      header.className = "app-header";

      const title = document.createElement("h1");
      title.className = "app-title";
      title.textContent =
        "Análise de Emissões de Gases de Efeito Estufa no Brasil";

      const subtitle = document.createElement("p");
      subtitle.className = "app-subtitle";
      subtitle.textContent =
        "Sistema de Estimativas de Emissões e Remoções de Gases de Efeito Estufa (SEEG)";

      header.appendChild(title);
      header.appendChild(subtitle);

      const dataSection = this.createSection(
        "data-section",
        "Processamento de Dados"
      );
      const modelSection = this.createSection(
        "model-section",
        "Modelo de Machine Learning"
      );
      const resultsSection = this.createSection(
        "results-section",
        "Resultados e Previsões"
      );

      const dataButton = document.createElement("button");
      dataButton.className = "btn btn-primary";
      dataButton.textContent = "Carregar e Processar Dados";
      dataButton.onclick = API.loadData.bind(API);

      const dataSummaryContainer = document.createElement("div");
      dataSummaryContainer.id = "data-summary";

      dataSection.appendChild(dataButton);
      dataSection.appendChild(dataSummaryContainer);

      const trainButton = document.createElement("button");
      trainButton.className = "btn btn-primary";
      trainButton.textContent = "Treinar Modelo";
      trainButton.id = "train-button";
      trainButton.disabled = true;
      trainButton.onclick = API.trainModel.bind(API);

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
      predictButton.onclick = API.generatePredictions.bind(API);

      const predictionsContainer = document.createElement("div");
      predictionsContainer.id = "predictions-container";

      resultsSection.appendChild(predictButton);
      resultsSection.appendChild(predictionsContainer);

      appContainer.appendChild(header);
      appContainer.appendChild(dataSection);
      appContainer.appendChild(modelSection);
      appContainer.appendChild(resultsSection);
    },

    createSection: function (id, title) {
      const section = document.createElement("section");
      section.className = "section";
      section.id = id;

      const sectionTitle = document.createElement("h2");
      sectionTitle.className = "section-title";
      sectionTitle.textContent = title;

      section.appendChild(sectionTitle);
      return section;
    },

    renderDataSummary: function (data) {
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
          ${DataUtils.createSampleDataTable(summary.sampleData)}
        </div>
        
        <h4 style="margin-top:18px">Estatísticas Numéricas</h4>
        ${DataUtils.createStatsTable(summary.numericStats)}
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
    },

    renderModelInfo: function (info) {
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
    },

    renderPredictionResults: function (results) {
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

        Charts.renderComparisonChart(comparisonData);
      }

      // Previsões futuras
      if (results.futurePredictions && results.futurePredictions.length > 0) {
        Charts.renderFuturePredictions(results.futurePredictions, container);
      }
    },
  };

  // Módulo para funções de utilidade de dados
  const DataUtils = {
    createSampleDataTable: function (sampleData) {
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
    },

    createStatsTable: function (stats) {
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
    },
  };

  // Módulo para criação e gerenciamento de gráficos
  const Charts = {
    renderTrainingChart: function (historyData) {
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
    },

    renderComparisonChart: function (comparisonData) {
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
    },

    renderFuturePredictions: function (futurePredictions, container) {
      const futureCard = document.createElement("div");
      futureCard.className = "card";

      futureCard.innerHTML = `
        <h3>Previsões Futuras</h3>
        <p>Projeção de emissões para os próximos anos:</p>
      `;

      // Adicionar tabela de dados previstos
      const futureTable = document.createElement("div");
      futureTable.style.marginTop = "20px";
      futureTable.innerHTML = `
        <h4>Valores previstos por ano</h4>
        <table>
          <thead>
            <tr>
              <th>Ano</th>
              <th>Emissão Prevista</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
            ${futurePredictions
              .map((item, index) => {
                const yearFormatted = Math.round(item.year);
                const predictionFormatted = item.prediction.toFixed(2);

                // Calcular variação percentual
                let variation = "";
                if (index > 0) {
                  const prevValue = futurePredictions[index - 1].prediction;
                  const change =
                    ((item.prediction - prevValue) / prevValue) * 100;
                  const changeFormatted = change.toFixed(1);
                  const changeColor =
                    change >= 0 ? "color: #dc2626" : "color: #16a34a";
                  const changeIcon = change >= 0 ? "↑" : "↓";
                  variation = `<span style="${changeColor}">${changeIcon} ${Math.abs(
                    changeFormatted
                  )}%</span>`;
                } else {
                  variation = `<span style="color: #6b7280; font-style: italic">Valor inicial</span>`;
                }

                return `
                <tr>
                  <td><strong>${yearFormatted}</strong></td>
                  <td>${predictionFormatted}</td>
                  <td>${variation}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      `;

      futureCard.appendChild(futureTable);

      // Container para o gráfico
      const futureChartContainer = document.createElement("div");
      futureChartContainer.className = "chart-container";
      futureChartContainer.innerHTML = '<canvas id="future-chart"></canvas>';

      futureCard.appendChild(futureChartContainer);
      container.appendChild(futureCard);

      // Obter anos e previsões
      const years = futurePredictions.map((item) => Math.round(item.year));
      const predictions = futurePredictions.map((item) => item.prediction);

      // Calcular tendência geral
      const firstPrediction = predictions[0];
      const lastPrediction = predictions[predictions.length - 1];
      const overallChange =
        ((lastPrediction - firstPrediction) / firstPrediction) * 100;
      const trendDirection = overallChange >= 0 ? "crescimento" : "redução";

      // Adicionar informação de tendência
      const trendInfo = document.createElement("div");
      trendInfo.className = "alert";
      trendInfo.classList.add(
        overallChange >= 0 ? "alert-error" : "alert-success"
      );
      trendInfo.innerHTML = `
        <strong>Tendência geral:</strong> ${Math.abs(overallChange).toFixed(
          1
        )}% de ${trendDirection} 
        nas emissões entre ${years[0]} e ${years[years.length - 1]}.
      `;
      futureCard.appendChild(trendInfo);

      // Obter contexto do gráfico
      const ctx = document.getElementById("future-chart").getContext("2d");

      // Criar gradiente para o fundo
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(76, 175, 80, 0.2)");
      gradient.addColorStop(1, "rgba(76, 175, 80, 0.0)");

      // Configurar e renderizar o gráfico
      new Chart(ctx, {
        type: "line",
        data: {
          labels: years,
          datasets: [
            {
              label: "Emissões Previstas",
              data: predictions,
              borderColor: "rgba(76, 175, 80, 0.8)",
              backgroundColor: gradient,
              tension: 0.3,
              fill: true,
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: "rgba(76, 175, 80, 0.8)",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Previsão de Emissões Futuras",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `Emissão: ${context.raw.toFixed(2)}`;
                },
                title: function (context) {
                  return `Ano: ${context[0].label}`;
                },
              },
            },
            legend: {
              position: "top",
            },
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: "Ano",
                font: {
                  weight: "bold",
                },
              },
              ticks: {
                callback: function (value, index) {
                  return years[index];
                },
              },
              grid: {
                display: false,
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "Emissão Prevista",
                font: {
                  weight: "bold",
                },
              },
              beginAtZero: false,
            },
          },
          elements: {
            line: {
              tension: 0.4,
            },
          },
        },
      });
    },
  };

  // Módulo principal da aplicação
  const App = {
    // Estado global da aplicação
    state: {
      processedData: null,
      modelInfo: null,
      trainingHistory: null,
      comparisonResults: null,
    },

    // Inicialização da aplicação
    init: function () {
      UI.renderInitialUI();
    },
  };

  // Inicialização quando o DOM estiver carregado
  document.addEventListener("DOMContentLoaded", App.init);
})();
