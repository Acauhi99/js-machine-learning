export function create({ tf, path }) {
  // Função para carregar um modelo salvo
  async function loadModel() {
    const modelPath = path.join(process.cwd(), "models", "emissions-model");
    try {
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      return model;
    } catch (error) {
      console.error("Erro ao carregar modelo:", error);
      throw new Error("Modelo não encontrado. Treine o modelo primeiro.");
    }
  }

  // Função para fazer previsões com o modelo
  async function makePredictions(model, inputData, normalizationStats) {
    const { mean, stdDevs } = normalizationStats;

    // Normalizar os dados de entrada
    const inputTensor = tf.tensor2d(inputData, [
      inputData.length,
      inputData[0].length,
    ]);
    const normalizedInput = inputTensor.sub(mean).div(stdDevs);

    // Fazer previsões
    const predictions = model.predict(normalizedInput);

    // Converter para array
    const predictionsArray = await predictions.array();

    // Limpar tensores
    inputTensor.dispose();
    normalizedInput.dispose();
    predictions.dispose();

    return predictionsArray;
  }

  // Função para gerar previsões futuras
  async function generateFuturePredictions(
    model,
    lastDataPoint,
    normalizationStats,
    years = 10
  ) {
    const predictions = [];
    let currentInput = [...lastDataPoint];

    for (let i = 0; i < years; i++) {
      currentInput[0] += 1;

      // Fazer previsão para este ponto
      const predictionResult = await makePredictions(
        model,
        [currentInput],
        normalizationStats
      );

      predictions.push({
        year: currentInput[0],
        prediction: predictionResult[0][0],
      });
    }

    return predictions;
  }

  // Função para comparar resultados reais com previsões
  async function compareWithActual(model, testingData, normalizationStats) {
    const { xs, ys } = testingData;

    // Fazer previsões no conjunto de teste
    const xsArray = await xs.array();
    const predictions = await makePredictions(
      model,
      xsArray,
      normalizationStats
    );

    const actualValues = await ys.array();

    // Calcular métricas
    const mse = tf.metrics
      .meanSquaredError(tf.tensor(actualValues), tf.tensor(predictions))
      .dataSync()[0];

    const mae = tf.metrics
      .meanAbsoluteError(tf.tensor(actualValues), tf.tensor(predictions))
      .dataSync()[0];

    // Preparar resultado para visualização
    const comparison = xsArray.map((features, i) => ({
      features,
      actual: actualValues[i][0],
      predicted: predictions[i][0],
      error: Math.abs(actualValues[i][0] - predictions[i][0]),
    }));

    return {
      comparison: comparison.slice(0, 20), // Retornar apenas alguns exemplos
      metrics: {
        mse,
        mae,
        rmse: Math.sqrt(mse),
      },
    };
  }

  return {
    loadModel,
    makePredictions,
    generateFuturePredictions,
    compareWithActual,
  };
}
