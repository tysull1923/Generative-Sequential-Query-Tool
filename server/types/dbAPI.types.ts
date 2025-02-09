// server/types/api.types.ts
import { Request } from 'express';
import { Document } from 'mongoose';

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginationQuery {
	page?: number;
	limit?: number;
	sort?: string;
	order?: 'asc' | 'desc';
}

export interface FilterQuery {
	[key: string]: any;
}

export interface RequestWithFilter<T = any> extends Request {
	filter?: FilterQuery;
	pagination?: PaginationQuery;
	body: T;
}

export type DocumentResponse<T extends Document> = ApiResponse<T>;
export type DocumentsResponse<T extends Document> = ApiResponse<T[]>;