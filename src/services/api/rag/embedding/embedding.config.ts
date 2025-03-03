// src/server/config/embedding.config.ts

import { OpenAIEmbeddingsParams } from '@langchain/openai';
import { CohereEmbeddingsParams } from '@langchain/cohere';

export type EmbeddingModelConfig = {
	modelName: string;
	dimensions: number;
	maxInputLength: number;
	truncate?: boolean;
	batchSize?: number;
	stripNewLines?: boolean;
};

export type EmbeddingProviderConfig = {
	models: Record<string, EmbeddingModelConfig>;
	defaultModel: string;
};

export const embeddingConfig = {
	providers: {
		openai: {
			models: {
				'text-embedding-ada-002': {
					modelName: 'text-embedding-ada-002',
					dimensions: 1536,
					maxInputLength: 8191,
					batchSize: 512,
					stripNewLines: true,
					truncate: true
				}
			},
			defaultModel: 'text-embedding-ada-002'
		} as EmbeddingProviderConfig,

		cohere: {
			models: {
				'embed-multilingual-v3.0': {
					modelName: 'embed-multilingual-v3.0',
					dimensions: 1024,
					maxInputLength: 2048,
					batchSize: 96,
					stripNewLines: true
				},
				'embed-english-v3.0': {
					modelName: 'embed-english-v3.0',
					dimensions: 1024,
					maxInputLength: 2048,
					batchSize: 96,
					stripNewLines: true
				}
			},
			defaultModel: 'embed-multilingual-v3.0'
		} as EmbeddingProviderConfig
	},

	textSplitters: {
		markdown: {
			chunkSize: 1000,
			chunkOverlap: 200,
			separators: ['\n## ', '\n### ', '\n#### ', '\n', ' ', '']
		},
		code: {
			chunkSize: 500,
			chunkOverlap: 100,
			separators: ['\n\n', '\n', ' ']
		},
		default: {
			chunkSize: 500,
			chunkOverlap: 50,
			separators: ['\n\n', '\n', ' ', '']
		}
	}
};

export function getModelConfig(
	provider: 'openai' | 'cohere',
	modelName?: string
): EmbeddingModelConfig {
	const providerConfig = embeddingConfig.providers[provider];
	const model = modelName || providerConfig.defaultModel;
	const config = providerConfig.models[model];

	if (!config) {
		throw new Error(`Model ${model} not found for provider ${provider}`);
	}

	return config;
}

export function createOpenAIEmbeddingsConfig(
	apiKey: string,
	modelName?: string
): OpenAIEmbeddingsParams {
	const config = getModelConfig('openai', modelName);

	return {
		openAIApiKey: apiKey,
		modelName: config.modelName,
		batchSize: config.batchSize,
		stripNewLines: config.stripNewLines,
		maxConcurrency: 5 // Limit concurrent requests
	};
}

export function createCohereEmbeddingsConfig(
	apiKey: string,
	modelName?: string
): CohereEmbeddingsParams {
	const config = getModelConfig('cohere', modelName);

	return {
		apiKey,
		modelName: config.modelName,
		maxConcurrency: 5,
		maxRetries: 3
	};
}

export function getChunkingConfig(documentType: 'markdown' | 'code' | 'default' = 'default') {
	return embeddingConfig.textSplitters[documentType];
}

export default {
	embeddingConfig,
	getModelConfig,
	createOpenAIEmbeddingsConfig,
	createCohereEmbeddingsConfig,
	getChunkingConfig
};