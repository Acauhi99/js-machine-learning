import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import tf from "@tensorflow/tfjs-node";

import * as dataProcessorFactory from "../services/data-processor.js";
import * as modelTrainerFactory from "../services/model-trainer.js";
import * as predictorFactory from "../services/predictor.js";

export function createContainer() {
  const dependencies = { fs, path, Papa, tf };

  return {
    dataProcessor: dataProcessorFactory.create(dependencies),
    modelTrainer: modelTrainerFactory.create(dependencies),
    predictor: predictorFactory.create(dependencies),
    state: {
      processedData: null,
      trainedModel: null,
      normalizationStats: null,
    },
  };
}
