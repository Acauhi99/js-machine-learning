export function create({ fs, path, Papa, tf }) {
  // Função para carregar e processar os dados CSV
  async function loadAndProcessData(filePath) {
    try {
      const csvData = await fs.readFile(filePath, "utf8");

      return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            resolve(
              results.data.filter((row) =>
                Object.values(row).some((val) => val !== null)
              )
            );
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      throw error;
    }
  }

  // Função para converter colunas categóricas em numéricas
  function preprocessCategoricalData(data) {
    // Mapear colunas categóricas para valores numéricos
    const categoricalColumns = [
      "tipo_emissao",
      "gas",
      "atividade_economica",
      "produto",
      "nivel_1",
      "nivel_2",
      "nivel_3",
      "nivel_4",
      "nivel_5",
      "nivel_6",
    ];

    const mappings = {};

    categoricalColumns.forEach((column) => {
      if (data[0] && data[0][column] !== undefined) {
        const uniqueValues = [
          ...new Set(data.map((row) => row[column])),
        ].filter((val) => val !== null);
        mappings[column] = uniqueValues.reduce((map, val, index) => {
          map[val] = index;
          return map;
        }, {});
      }
    });

    // Converter colunas categóricas para numéricas
    return data.map((row) => {
      const newRow = { ...row };

      categoricalColumns.forEach((column) => {
        if (
          mappings[column] &&
          row[column] !== null &&
          row[column] !== undefined
        ) {
          newRow[`${column}_num`] = mappings[column][row[column]];
        } else {
          newRow[`${column}_num`] = null;
        }
      });

      return newRow;
    });
  }

  // Função para preparar os dados para o modelo
  function prepareData(data, targetColumn, features) {
    // Filtrar linhas com valores nulos nas features ou target
    const filteredData = data.filter((row) => {
      return (
        features.every(
          (feature) => row[feature] !== null && row[feature] !== undefined
        ) &&
        row[targetColumn] !== null &&
        row[targetColumn] !== undefined
      );
    });

    if (filteredData.length === 0) {
      throw new Error(
        "Após filtragem de dados nulos, não restaram registros para treinar o modelo."
      );
    }

    console.log(
      `Utilizando ${filteredData.length} registros após remoção de dados nulos.`
    );

    const xs = filteredData.map((row) =>
      features.map((feature) => row[feature])
    );
    const ys = filteredData.map((row) => row[targetColumn]);

    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

    const { mean, variance } = tf.moments(xsTensor, 0);
    const stdDevs = variance.sqrt();

    const normalizedXs = xsTensor.sub(mean).div(stdDevs);

    const splitIdx = Math.floor(filteredData.length * 0.8);

    const trainingXs = normalizedXs.slice([0, 0], [splitIdx, features.length]);
    const trainingYs = ysTensor.slice([0, 0], [splitIdx, 1]);

    const testingXs = normalizedXs.slice(
      [splitIdx, 0],
      [filteredData.length - splitIdx, features.length]
    );
    const testingYs = ysTensor.slice(
      [splitIdx, 0],
      [filteredData.length - splitIdx, 1]
    );

    return {
      training: { xs: trainingXs, ys: trainingYs },
      testing: { xs: testingXs, ys: testingYs },
      stats: { mean, stdDevs },
      featureNames: features,
      targetName: targetColumn,
    };
  }

  // Função principal para processar dados de emissões
  async function processEmissionsData(dataPath) {
    const filePath = path.join(dataPath, "emissions.csv");
    const rawData = await loadAndProcessData(filePath);

    if (!rawData || rawData.length === 0) {
      throw new Error("Arquivo CSV vazio ou inválido");
    }

    // Verificar se as colunas esperadas existem
    const expectedColumns = ["ano", "emissao"];
    const missingColumns = expectedColumns.filter(
      (col) => !(col in rawData[0])
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Colunas obrigatórias ausentes no CSV: ${missingColumns.join(", ")}`
      );
    }

    // Pré-processar dados categóricos
    const processedData = preprocessCategoricalData(rawData);

    // Definir coluna alvo e features
    const targetColumn = "emissao";

    // Usar colunas numéricas
    const features = [
      "ano",
      "tipo_emissao_num",
      "gas_num",
      "atividade_economica_num",
    ];

    const availableFeatures = features.filter(
      (feature) => processedData[0] && processedData[0][feature] !== undefined
    );

    if (availableFeatures.length === 0) {
      throw new Error("Nenhuma feature válida disponível após processamento");
    }

    console.log(`Features selecionadas: ${availableFeatures.join(", ")}`);

    return prepareData(processedData, targetColumn, availableFeatures);
  }

  // Função para obter detalhes da análise exploratória dos dados
  async function getDataSummary(dataPath) {
    const filePath = path.join(dataPath, "emissions.csv");
    const data = await loadAndProcessData(filePath);

    const sampleSize = data.length;
    const columns = Object.keys(data[0] || {});

    // Estatísticas para colunas numéricas
    const stats = {};
    columns.forEach((col) => {
      if (typeof data[0][col] === "number") {
        const values = data
          .map((row) => row[col])
          .filter((val) => val !== null && !isNaN(val));

        if (values.length > 0) {
          stats[col] = {
            min: Math.min(...values),
            max: Math.max(...values),
            mean: values.reduce((sum, val) => sum + val, 0) / values.length,
            count: values.length,
          };
        }
      }
    });

    // Estatísticas para colunas categóricas
    const categoricalStats = {};
    columns.forEach((col) => {
      if (typeof data[0][col] === "string") {
        const values = data
          .map((row) => row[col])
          .filter((val) => val !== null);

        const uniqueValues = [...new Set(values)];

        categoricalStats[col] = {
          uniqueCount: uniqueValues.length,
          examples: uniqueValues.slice(0, 5),
          mostCommon: getMostCommonValue(values),
          count: values.length,
        };
      }
    });

    return {
      sampleSize,
      columns,
      numericStats: stats,
      categoricalStats,
      sampleData: data.slice(0, 5),
    };
  }

  // Encontrar o valor mais comum em um array
  function getMostCommonValue(arr) {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    let maxCount = 0;
    let maxValue = null;

    for (const [value, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxValue = value;
      }
    }

    return { value: maxValue, count: maxCount };
  }

  return {
    processEmissionsData,
    getDataSummary,
  };
}
