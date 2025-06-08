/**
 * MongoDB Types and Interfaces
 * Updated: 08/06/2025
 * Author: Deej Potter
 */

import { ObjectId } from "mongodb";

export interface MongoDocument {
	_id?: ObjectId | string;
	createdAt?: Date;
	updatedAt?: Date;
	deletedAt?: Date | null;
}

export interface DatabaseResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	status?: number;
	message?: string;
}
