import mongoose, { ClientSession } from 'mongoose';
import { Workflow, IWorkflow } from './schemas';
import { DatabaseService } from './DatabaseService';
import NodeCache from 'node-cache';

// ==================== Types & Interfaces ====================

export interface WorkflowComponent {
  id: string;
  type: 'requirements' | 'prompts' | 'data_analysis' | 'sequential' | 'code';
  title: string;
  content: string;
  position: { x: number; y: number };
  status: 'pending' | 'executing' | 'completed' | 'error';
  metadata: Record<string, any>;
  version: number;
}

export interface WorkflowRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface WorkflowResults {
  componentId: string;
  output: any;
  status: 'success' | 'error';
  timestamp: Date;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface ExecutionStep {
  componentId: string;
  status: 'pending' | 'executing' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  error?: string;
  results?: WorkflowResults;
}

export interface WorkflowExecution {
  id: string;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  steps: ExecutionStep[];
  metadata: Record<string, any>;
}

export interface WorkflowDocument extends Omit<IWorkflow, '_id'> {
  id?: string;
  components: WorkflowComponent[];
  relationships: WorkflowRelationship[];
  executions: WorkflowExecution[];
  currentVersion: number;
  versions: {
    version: number;
    components: WorkflowComponent[];
    relationships: WorkflowRelationship[];
    timestamp: Date;
    metadata: Record<string, any>;
  }[];
}

export interface WorkflowFilter {
  userId?: string;
  status?: 'draft' | 'active' | 'archived';
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class WorkflowServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'WorkflowServiceError';
  }
}

// ==================== Service Implementation ====================

export class WorkflowService {
  private static instance: WorkflowService;
  private dbService: DatabaseService;
  private cache: NodeCache;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  // ==================== CRUD Operations ====================

  public async createWorkflow(workflow: WorkflowDocument): Promise<string> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Initialize version control
      workflow.currentVersion = 1;
      workflow.versions = [{
        version: 1,
        components: workflow.components,
        relationships: workflow.relationships,
        timestamp: new Date(),
        metadata: { createdAt: new Date() }
      }];

      const newWorkflow = new Workflow(workflow);
      await newWorkflow.validate();
      await newWorkflow.save({ session });

      await session.commitTransaction();
      return newWorkflow._id.toString();
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error creating workflow');
    } finally {
      session.endSession();
    }
  }

  public async getWorkflow(id: string): Promise<WorkflowDocument> {
    try {
      const cached = this.cache.get<WorkflowDocument>(id);
      if (cached) return cached;

      const workflow = await Workflow.findById(id).exec();
      if (!workflow) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      this.cache.set(id, workflow);
      return workflow;
    } catch (error) {
      throw this.handleError(error, 'Error retrieving workflow');
    }
  }

  public async updateWorkflow(
    id: string, 
    update: Partial<WorkflowDocument>
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const workflow = await Workflow.findById(id).session(session);
      if (!workflow) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      // Handle version control
      if (update.components || update.relationships) {
        workflow.currentVersion++;
        workflow.versions.push({
          version: workflow.currentVersion,
          components: update.components || workflow.components,
          relationships: update.relationships || workflow.relationships,
          timestamp: new Date(),
          metadata: { updatedAt: new Date() }
        });
      }

      Object.assign(workflow, update);
      await workflow.validate();
      await workflow.save({ session });

      await session.commitTransaction();
      this.cache.del(id);
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error updating workflow');
    } finally {
      session.endSession();
    }
  }

  public async deleteWorkflow(id: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await Workflow.findByIdAndDelete(id).session(session);
      if (!result) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      await session.commitTransaction();
      this.cache.del(id);
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error deleting workflow');
    } finally {
      session.endSession();
    }
  }

  public async listWorkflows(filter: WorkflowFilter): Promise<WorkflowDocument[]> {
    try {
      const query = this.buildQuery(filter);
      const sort = this.buildSort(filter);
      const { skip, limit } = this.buildPagination(filter);

      return await Workflow.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      throw this.handleError(error, 'Error listing workflows');
    }
  }

  // ==================== Component Management ====================

  public async addComponent(
    workflowId: string, 
    component: WorkflowComponent
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const workflow = await Workflow.findById(workflowId).session(session);
      if (!workflow) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      workflow.components.push(component);
      workflow.currentVersion++;
      workflow.versions.push({
        version: workflow.currentVersion,
        components: workflow.components,
        relationships: workflow.relationships,
        timestamp: new Date(),
        metadata: { componentAdded: component.id }
      });

      await workflow.save({ session });
      await session.commitTransaction();
      this.cache.del(workflowId);
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error adding component');
    } finally {
      session.endSession();
    }
  }

  public async addRelationship(
    workflowId: string, 
    relationship: WorkflowRelationship
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const workflow = await Workflow.findById(workflowId).session(session);
      if (!workflow) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      // Validate that source and target components exist
      const sourceExists = workflow.components.some(c => c.id === relationship.sourceId);
      const targetExists = workflow.components.some(c => c.id === relationship.targetId);
      
      if (!sourceExists || !targetExists) {
        throw new WorkflowServiceError(
          'Source or target component not found',
          'INVALID_RELATIONSHIP'
        );
      }

      workflow.relationships.push(relationship);
      workflow.currentVersion++;
      workflow.versions.push({
        version: workflow.currentVersion,
        components: workflow.components,
        relationships: workflow.relationships,
        timestamp: new Date(),
        metadata: { relationshipAdded: relationship.id }
      });

      await workflow.save({ session });
      await session.commitTransaction();
      this.cache.del(workflowId);
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error adding relationship');
    } finally {
      session.endSession();
    }
  }

  // ==================== Execution & Results ====================

  public async saveResults(
    workflowId: string, 
    results: WorkflowResults
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const workflow = await Workflow.findById(workflowId).session(session);
      if (!workflow) {
        throw new WorkflowServiceError('Workflow not found', 'WORKFLOW_NOT_FOUND');
      }

      // Find the latest execution or create a new one
      let currentExecution = workflow.executions[workflow.executions.length - 1];
      if (!currentExecution || currentExecution.status !== 'started') {
        currentExecution = {
          id: new mongoose.Types.ObjectId().toString(),
          status: 'started',
          startTime: new Date(),
          steps: []
        } as WorkflowExecution;
        workflow.executions.push(currentExecution);
      }

      // Update the execution step
      const step = currentExecution.steps.find(s => s.componentId === results.componentId);
      if (step) {
        step.status = results.status === 'success' ? 'completed' : 'error';
        step.endTime = new Date();
        step.results = results;
      } else {
        currentExecution.steps.push({
          componentId: results.componentId,
          status: results.status === 'success' ? 'completed' : 'error',
          startTime: new Date(),
          endTime: new Date(),
          results
        });
      }

      // Check if all steps are completed
      const allCompleted = currentExecution.steps.every(
        s => s.status === 'completed' || s.status === 'error'
      );
      if (allCompleted) {
        currentExecution.status = 'completed';
        currentExecution.endTime = new Date();
      }

      await workflow.save({ session });
      await session.commitTransaction();
      this.cache.del(workflowId);
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error saving results');
    } finally {
      session.endSession();
    }
  }

  // ==================== Helper Methods ====================

  private buildQuery(filter: WorkflowFilter): any {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.status) query.status = filter.status;
    if (filter.tags?.length) query['metadata.tags'] = { $all: filter.tags };

    if (filter.startDate || filter.endDate) {
      query['metadata.created'] = {};
      if (filter.startDate) query['metadata.created'].$gte = filter.startDate;
      if (filter.endDate) query['metadata.created'].$lte = filter.endDate;
    }

    if (filter.search) {
      query.$or = [
        { title: new RegExp(filter.search, 'i') },
        { description: new RegExp(filter.search, 'i') }
      ];
    }

    return query;
  }

  private buildSort(filter: WorkflowFilter): any {
    const sort: any = {};
    if (filter.sortBy) {
      sort[filter.sortBy] = filter.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['metadata.created'] = -1;
    }
    return sort;
  }

  private buildPagination(filter: WorkflowFilter): { skip: number; limit: number } {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, filter.limit || 10);
    return {
      skip: (page - 1) * limit,
      limit
    };
  }

  private handleError(error: any, context: string): WorkflowServiceError {
    if (error instanceof WorkflowServiceError) {
      return error;
    }

    if (error.name === 'ValidationError') {
      return new WorkflowServiceError(
        `Validation error: ${error.message}`,
        'VALIDATION_ERROR'
      );
    }

    if (error.name === 'MongoError') {
      if (error.code === 11000) {
        return new WorkflowServiceError(
          'Duplicate key error',
          'DUPLICATE_KEY_ERROR'
        );
      }
    }

    return new WorkflowServiceError(
      `${context}: ${error.message}`,
      'INTERNAL_ERROR',
      false
    );
  }
}

// ==================== Usage Example ====================

/*
async function example() {
  const workflowService = WorkflowService.getInstance();

  try {
    // Create a new workflow
    const workflowId = await workflowService.createWorkflow({
      title: 'Data Processing Workflow',
      description: 'Process and analyze data',
      components: [],
      relationships: [],
      status: 'draft',
      userId: 'user123',
      metadata: {
        created: new Date(),
        tags: ['data', 'analysis']
      },
      executions: [],
      currentVersion: 1,
      versions: []
    });

    // Add components
    await workflowService.addComponent(workflowId, {
      id: 'comp1',
      type: 'data_analysis',
      title: 'Data Import',
      content: 'Import data from CSV',
      position: { x: 100, y: 100 },
      status: 'pending',
      metadata: {},
      version: 1
    });

    await workflowService.addComponent(workflowId, {
      id: 'comp2',
      type: 'data_analysis',
      title: 'Data Processing',
      content: 'Process imported data',
      position: { x: 300, y: 100 },
      status: 'pending',
      metadata: {},
      version: 1
    });

    // Add relationships
    await workflowService.addRelationship(workflowId, {
      id: 'rel1',
      sourceId: 'comp1',
      targetId: 'comp2',
      type: 'dataFlow',
      metadata: {
        description: 'CSV data flow'
      }
    });

    // Save execution results
    await workflowService.saveResults(workflowId, {
      componentId: 'comp1',
      output: {
        rowsProcessed: 1000,
        success: true
      },
      status: 'success',
      timestamp: new Date(),
      executionTime: 1500,
      metadata: {
        memoryUsed: '256MB'
      }
    });

    // List workflows with filtering
    const workflows = await workflowService.listWorkflows({
      userId: 'user123',
      status: 'draft',
      tags: ['data'],
      page: 1,
      limit: 10,
      sortBy: 'metadata.created',
      sortOrder: 'desc'
    });

    console.log('Created workflow:', workflowId);
    console.log('Found workflows:', workflows.length);

  } catch (error) {
    if (error instanceof WorkflowServiceError) {
      console.error('Workflow error:', error.message, 'Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example of version retrieval and component status update
async function workflowVersionExample() {
  const workflowService = WorkflowService.getInstance();

  try {
    const workflow = await workflowService.getWorkflow('workflowId');
    
    // Get specific version
    const version = workflow.versions.find(v => v.version === 1);
    
    // Update component status
    await workflowService.updateWorkflow('workflowId', {
      components: workflow.components.map(comp => 
        comp.id === 'comp1' 
          ? { ...comp, status: 'completed' }
          : comp
      )
    });

  } catch (error) {
    console.error('Version management error:', error);
  }
}

// Example of workflow execution tracking
async function executionTrackingExample() {
  const workflowService = WorkflowService.getInstance();

  try {
    // Start execution
    const workflow = await workflowService.getWorkflow('workflowId');
    const execution: WorkflowExecution = {
      id: new mongoose.Types.ObjectId().toString(),
      status: 'started',
      startTime: new Date(),
      steps: [],
      metadata: {
        initiatedBy: 'user123',
        environment: 'production'
      }
    };

    await workflowService.updateWorkflow('workflowId', {
      executions: [...workflow.executions, execution]
    });

    // Track progress
    for (const component of workflow.components) {
      await workflowService.saveResults('workflowId', {
        componentId: component.id,
        status: 'success',
        output: { status: 'completed' },
        timestamp: new Date(),
        executionTime: 1000,
        metadata: {
          step: component.title
        }
      });
    }

  } catch (error) {
    console.error('Execution tracking error:', error);
  }
}
*/

export default WorkflowService;