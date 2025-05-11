import { Router } from "express";

export function createRoutes(container) {
  const router = Router();
  const { dataProcessor, modelTrainer, predictor, state } = container;

  // Rota para processamento de dados
  router.get("/api/data", async (req, res) => {
    try {
      // Processar os dados
      state.processedData = await dataProcessor.processEmissionsData(
        req.app.locals.dataPath
      );
      const dataSummary = await dataProcessor.getDataSummary(
        req.app.locals.dataPath
      );

      state.normalizationStats = state.processedData.stats;

      res.json({
        summary: dataSummary,
        features: state.processedData.featureNames,
        target: state.processedData.targetName,
        sampleSize: dataSummary.sampleSize,
      });
    } catch (error) {
      console.error("Erro ao processar dados:", error);
      res.status(500).json({ error: "Erro ao processar dados" });
    }
  });

  // Rota para treinamento do modelo
  router.post("/api/train", async (req, res) => {
    try {
      if (!state.processedData) {
        return res.status(400).json({
          error: "Dados não processados. Chame /api/data primeiro.",
        });
      }

      const { epochs, batchSize } = req.body;
      const trainingResult = await modelTrainer.trainModel(
        state.processedData.training,
        epochs,
        batchSize
      );

      state.trainedModel = trainingResult.model;
      const evaluationResult = await modelTrainer.evaluateModel(
        state.trainedModel,
        state.processedData.testing
      );
      const modelSummary = modelTrainer.getModelSummary(state.trainedModel);

      res.json({
        trainingHistory: trainingResult.history,
        evaluation: evaluationResult,
        modelInfo: modelSummary,
      });
    } catch (error) {
      console.error("Erro ao treinar modelo:", error);
      res.status(500).json({ error: "Erro ao treinar modelo" });
    }
  });

  // Rota para predições
  router.post("/api/predict", async (req, res) => {
    try {
      // Verificar se o modelo existe ou carregar um modelo salvo
      if (!state.trainedModel) {
        try {
          state.trainedModel = await predictor.loadModel();
        } catch (error) {
          return res.status(400).json({
            error: "Modelo não disponível. Treine o modelo primeiro.",
          });
        }
      }

      if (!state.processedData || !state.normalizationStats) {
        return res.status(400).json({
          error: "Dados não processados. Chame /api/data primeiro.",
        });
      }

      // Extrair parâmetros da requisição
      const { inputData, generateFuture } = req.body;

      let result = {};

      // Comparar com dados reais
      const comparison = await predictor.compareWithActual(
        state.trainedModel,
        state.processedData.testing,
        state.normalizationStats
      );

      result.comparison = comparison;

      // Gerar previsões futuras (
      if (generateFuture) {
        const futureYear = new Date().getFullYear() + 10;
        const testData = await state.processedData.testing.xs.array();
        const lastDataPoint = testData[testData.length - 1];

        const futurePredictions = await predictor.generateFuturePredictions(
          state.trainedModel,
          lastDataPoint,
          state.normalizationStats,
          futureYear
        );

        result.futurePredictions = futurePredictions;
      }

      // Se houver dados de entrada específicos
      if (inputData && inputData.length > 0) {
        const customPredictions = await predictor.makePredictions(
          state.trainedModel,
          inputData,
          state.normalizationStats
        );

        result.customPredictions = customPredictions;
      }

      res.json(result);
    } catch (error) {
      console.error("Erro ao fazer predições:", error);
      res
        .status(500)
        .json({ error: "Erro ao fazer predições: " + error.message });
    }
  });

  // Rota para informações do modelo
  router.get("/api/model-info", async (req, res) => {
    try {
      // Verificar se o modelo está disponível ou tentar carregar
      if (!state.trainedModel) {
        try {
          state.trainedModel = await predictor.loadModel();
        } catch (error) {
          return res.status(400).json({
            error: "Modelo não disponível. Treine o modelo primeiro.",
          });
        }
      }

      // Obter informações do modelo
      const modelSummary = modelTrainer.getModelSummary(state.trainedModel);

      // Incluir informações adicionais se os dados estiverem disponíveis
      const response = {
        architecture: modelSummary,
        createdAt: new Date().toISOString(),
      };

      // Adicionar métricas se disponíveis
      if (state.processedData) {
        try {
          const evaluation = await modelTrainer.evaluateModel(
            state.trainedModel,
            state.processedData.testing
          );
          response.metrics = evaluation;
        } catch (error) {
          console.warn("Não foi possível avaliar o modelo:", error);
        }

        // Adicionar informações das features
        response.features = {
          inputs: state.processedData.featureNames,
          target: state.processedData.targetName,
        };
      }

      res.json(response);
    } catch (error) {
      console.error("Erro ao obter informações do modelo:", error);
      res.status(500).json({ error: "Erro ao obter informações do modelo" });
    }
  });

  return router;
}
