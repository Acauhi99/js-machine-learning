export function create({ tf, path, fs }) {
  // Função para criar um modelo multicamadas
  function createModel(inputShape) {
    const model = tf.sequential();

    // Primeira camada
    model.add(
      tf.layers.dense({
        inputShape: [inputShape],
        units: 64,
        activation: "relu",
        kernelInitializer: "heNormal",
      })
    );

    // Segunda camada
    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
        kernelInitializer: "heNormal",
      })
    );

    // Camada de saída
    model.add(
      tf.layers.dense({
        units: 1,
        activation: "linear",
      })
    );

    // Compilar o modelo
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mse", "mae"],
    });

    return model;
  }

  // Função para treinar o modelo
  async function trainModel(trainingData, epochs = 100, batchSize = 32) {
    const { xs, ys } = trainingData;

    const model = createModel(xs.shape[1]);

    // Configurar callbacks
    const history = [];

    // Treinar o modelo
    const result = await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          history.push({
            epoch,
            loss: logs.loss,
            val_loss: logs.val_loss,
            mse: logs.mse,
            val_mse: logs.val_mse,
            mae: logs.mae,
            val_mae: logs.val_mae,
          });
          console.log(
            `Epoch ${epoch}: loss = ${logs.loss}, val_loss = ${logs.val_loss}`
          );
        },
      },
    });

    // Salvar o modelo
    const modelSavePath = path.join(process.cwd(), "models");
    try {
      await fs.mkdir(modelSavePath, { recursive: true });
      await model.save(`file://${modelSavePath}/emissions-model`);
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
    }

    return {
      model,
      history,
      trainingResult: result,
    };
  }

  // Função para avaliar o modelo
  async function evaluateModel(model, testingData) {
    const { xs, ys } = testingData;

    const evaluation = await model.evaluate(xs, ys);

    return {
      testLoss: evaluation[0].dataSync()[0],
      testMSE: evaluation[1].dataSync()[0],
      testMAE: evaluation[2].dataSync()[0],
    };
  }

  // Função para obter a arquitetura do modelo
  function getModelSummary(model) {
    const layers = [];

    for (let i = 0; i < model.layers.length; i++) {
      const layer = model.layers[i];
      layers.push({
        name: layer.name,
        type: layer.getClassName(),
        units: layer.units,
        activation: layer.activation ? layer.activation.getClassName() : null,
        inputShape: layer.inputShape,
        outputShape: layer.outputShape,
      });
    }

    return {
      layers,
      optimizer: model.optimizer.getClassName(),
      loss: model.loss,
    };
  }

  return {
    trainModel,
    evaluateModel,
    getModelSummary,
  };
}
