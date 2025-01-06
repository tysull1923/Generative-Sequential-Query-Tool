/**
 * @fileoverview Type definitions for the GSQT chat management system
 */

import { ChatType } from './chat.types';

// Status and List Types
/**
 * Available statuses for chat items
 * @enum {string}
 */
export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
  DRAFT = 'draft',
  DELETED = 'deleted'
}

/**
 * Basic chat management item structure
 * @interface
 */
export interface ChatManagementItem {
  id: string;
  title: string;
  type: ChatType;
  lastModified: Date;
  status: ChatStatus;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended interface for base chat items
 * @extends ChatManagementItem
 */
export interface BaseChatItem extends ChatManagementItem {
  type: ChatType.BASE;
  messageCount: number;
}

/**
 * Extended interface for sequential chat items
 * @extends ChatManagementItem
 */
export interface SequentialChatItem extends ChatManagementItem {
  type: ChatType.SEQUENTIAL;
  stepCount: number;
  completedSteps: number;
}

/**
 * Extended interface for requirements chat items
 * @extends ChatManagementItem
 */
export interface RequirementsChatItem extends ChatManagementItem {
  type: ChatType.REQUIREMENTS;
  requirementsCount: number;
}

// Sort and Filter Types
/**
 * Available sort fields
 * @enum {string}
 */
export enum SortField {
  TITLE = 'title',
  CREATED_DATE = 'createdAt',
  MODIFIED_DATE = 'lastModified',
  STATUS = 'status'
}

/**
 * Sort direction options
 * @enum {string}
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for sort configuration
 * @interface
 */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Interface for filter criteria
 * @interface
 */
export interface FilterCriteria {
  types?: ChatType[];
  status?: ChatStatus[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  searchTerm?: string;
}

// Action Types
/**
 * Interface for save action parameters
 * @interface
 */
export interface SaveActionParams {
  id: string;
  title?: string;
  summary?: string;
  saveToFile?: boolean;
  fileName?: string;
}

/**
 * Interface for status update parameters
 * @interface
 */
export interface StatusUpdateParams {
  id: string;
  newStatus: ChatStatus;
  comment?: string;
}

/**
 * Interface for delete action parameters
 * @interface
 */
export interface DeleteActionParams {
  id: string;
  permanent: boolean;
}

// Component Props
/**
 * Props interface for management card component
 * @interface
 */
export interface ManagementCardProps {
  item: ChatManagementItem;
  onSave: (params: SaveActionParams) => Promise<void>;
  onCopy: (id: string) => Promise<void>;
  onDelete: (params: DeleteActionParams) => Promise<void>;
  onStatusUpdate: (params: StatusUpdateParams) => Promise<void>;
  className?: string;
}

/**
 * Props interface for chat list view
 * @interface
 */
export interface ChatListViewProps {
  items: ChatManagementItem[];
  sort: SortConfig;
  filter: FilterCriteria;
  onSortChange: (newSort: SortConfig) => void;
  onFilterChange: (newFilter: FilterCriteria) => void;
  onItemSelect: (id: string) => void;
  loading?: boolean;
  error?: string;
}

/**
 * Props interface for filter component
 * @interface
 */
export interface FilterProps {
  criteria: FilterCriteria;
  onChange: (newCriteria: FilterCriteria) => void;
  availableTypes: ChatType[];
  availableStatuses: ChatStatus[];
}

/**
 * Props interface for sort component
 * @interface
 */
export interface SortProps {
  config: SortConfig;
  onChange: (newConfig: SortConfig) => void;
  availableFields: SortField[];
}

// List States and Actions
/**
 * Interface for list view state
 * @interface
 */
export interface ListViewState {
  items: ChatManagementItem[];
  loading: boolean;
  error?: string;
  sort: SortConfig;
  filter: FilterCriteria;
  selectedItems: string[];
  page: number;
  totalPages: number;
}

/**
 * Type for batch action handlers
 * @type
 */
export type BatchActionHandler = (ids: string[]) => Promise<void>;

/**
 * Interface for list view actions
 * @interface
 */
export interface ListViewActions {
  onRefresh: () => Promise<void>;
  onPageChange: (newPage: number) => void;
  onBatchDelete: BatchActionHandler;
  onBatchArchive: BatchActionHandler;
  onBatchExport: BatchActionHandler;
}

// Database Types
/**
 * Interface for database chat record
 * @interface
 */
export interface ChatDatabaseRecord extends ChatManagementItem {
  content: string;
  settings: Record<string, unknown>;
  metadata: {
    version: string;
    lastAccessed: Date;
    accessCount: number;
  };
}

/**
 * Interface for database query options
 * @interface
 */
export interface ChatQueryOptions {
  sort?: SortConfig;
  filter?: FilterCriteria;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

/**
 * Interface for database operation result
 * @interface
 */
export interface DatabaseOperationResult {
  success: boolean;
  error?: string;
  affectedIds?: string[];
}