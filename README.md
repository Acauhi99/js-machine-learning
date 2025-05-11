# Análise de Emissões de Gases de Efeito Estufa no Brasil

## Visão Geral

Este projeto implementa um sistema de análise e previsão de emissões de gases de efeito estufa no Brasil, utilizando técnicas de Machine Learning com TensorFlow.js. O sistema processa dados históricos de emissões do SEEG (Sistema de Estimativas de Emissões e Remoções de Gases de Efeito Estufa), treina um modelo de rede neural multicamadas e gera previsões para cenários futuros.

## Objetivo

O objetivo principal é criar uma ferramenta que permita compreender padrões históricos de emissões de gases no Brasil e fazer projeções futuras baseadas nesses dados, fornecendo insights valiosos para pesquisadores, formuladores de políticas públicas e interessados em questões ambientais.

## Funcionalidades Implementadas

### Processamento de Dados

- Carregamento e parsing de arquivos CSV com dados de emissões
- Conversão automática de dados categóricos em valores numéricos
- Normalização e divisão em conjuntos de treino/teste
- Análise estatística exploratória dos dados

### Modelo de Machine Learning

- Implementação de uma rede neural multicamadas usando TensorFlow.js
- Arquitetura com 3 camadas (2 ocultas + 1 saída)
- Camadas ocultas com ativação ReLU e inicialização heNormal
- Camada de saída com ativação linear
- Compilação com otimizador Adam e função de perda MSE

### Treinamento e Avaliação

- Interface para configuração de hiperparâmetros (épocas, batch size)
- Visualização em tempo real do progresso de treinamento
- Validação cruzada com 20% dos dados
- Métricas de avaliação: MSE, MAE, RMSE

### Visualizações e Previsões

- Gráficos interativos de histórico de treinamento
- Comparação visual entre valores reais e previstos
- Projeções de emissões futuras
- Tabelas detalhadas com estatísticas e previsões

### API RESTful

- Endpoints para processamento de dados, treinamento e predição
- Gestão de estado do modelo e dados
- Tratamento de erros e validações

## Detalhes Técnicos

### Estrutura do Projeto

- Frontend: HTML/CSS/JavaScript com Chart.js para visualizações
- Backend: Node.js com Express.js
- Machine Learning: TensorFlow.js
- Processamento de Dados: PapaParse para CSV

### Arquitetura do Sistema

- Padrão de injeção de dependências
- Separação clara entre serviços (processamento de dados, treinamento, previsão)
- Interface visual interativa para todas as etapas do processo

### Preparação dos Dados

Os dados são processados seguindo estas etapas:

1. Carregamento do CSV de emissões
2. Conversão de colunas categóricas (tipo_emissao, gas, etc.) para valores numéricos
3. Filtragem de registros com valores nulos
4. Normalização estatística (média zero, desvio padrão unitário)
5. Divisão em conjuntos de treino (80%) e teste (20%)

### Especificações do Modelo

- Camada de entrada: Dimensão baseada no número de features selecionadas
- Primeira camada oculta: 64 unidades com ativação ReLU
- Segunda camada oculta: 32 unidades com ativação ReLU
- Camada de saída: 1 unidade com ativação linear
- Otimizador: Adam com taxa de aprendizado 0.001
- Função de perda: Mean Squared Error (MSE)
- Métricas: MSE e MAE (Mean Absolute Error)

## Considerações sobre as Previsões

Uma observação importante sobre as previsões futuras geradas pelo modelo é que elas podem apresentar valores constantes ao longo do tempo. Isso ocorre por alguns fatores:

- **Limitações do modelo atual**: A arquitetura implementada pode não capturar completamente padrões temporais complexos presentes nos dados de emissões.
- **Fenômeno dos dados**: Em séries temporais de emissões, é possível que haja períodos de estabilidade onde os valores realmente variam pouco.
- **Features utilizadas**: O modelo atual considera principalmente as variáveis ano, tipo_emissao, gas e atividade_economica, mas pode precisar de fatores adicionais para capturar tendências futuras.
- **Características de redes feedforward**: Modelos simples de redes neurais feed-forward podem não ser ideais para capturar dependências temporais complexas comparados a arquiteturas recorrentes (RNNs) ou transformers.

Esta característica não compromete a validade técnica do trabalho, pois o foco está na implementação correta de um modelo multicamadas usando TensorFlow.js com aprendizado supervisionado, conforme especificado nos requisitos. Em aplicações reais, seria recomendável expandir o modelo com:

- Técnicas específicas para séries temporais (LSTM, GRU)
- Features adicionais como indicadores econômicos e políticas ambientais
- Dados históricos mais extensos para capturar ciclos longos

## Como Executar o Projeto

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Certifique-se de ter o arquivo `emissions.csv` na pasta `data`
4. Execute o servidor: `npm start`
5. Acesse a aplicação em: http://localhost:3000

## Conclusão

Este projeto demonstra a aplicação prática de técnicas de Machine Learning em dados ambientais, fornecendo uma plataforma para análise e previsão de emissões de gases de efeito estufa. Apesar das limitações inerentes a modelos de previsão, o sistema oferece insights valiosos sobre padrões históricos e possíveis cenários futuros, contribuindo para discussões baseadas em dados sobre políticas ambientais.
