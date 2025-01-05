/**
 * Enum representing different types of chats available in the application
 */
export enum ChatType {
    BASE = 'BASE_CHAT',
    SEQUENTIAL = 'SEQUENTIAL_CHAT',
    REQUIREMENTS = 'REQUIREMENTS_CHAT',
    WORKFLOW = 'WORKFLOW_CREATION',
    SCHEDULER = 'SCHEDULER_CREATION'
  }
  
  /**
   * Enum representing the possible statuses of a chat
   */
  export enum ChatStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    PAUSED = 'PAUSED',
    DRAFT = 'DRAFT',
    ERROR = 'ERROR'
  }
  
  /**
   * Interface for the base properties of a chat
   */
  export interface BaseChat {
    id: string;
    title: string;
    type: ChatType;
    createdAt: Date;
    lastModified: Date;
    status: ChatStatus;
    summary?: string;
  }
  
  /**
   * Interface for recent chats displayed on the homepage
   */
  export interface RecentChat extends BaseChat {
    previewText?: string;
    savedToApplication: boolean;
    savedToFile: boolean;
  }
  
  /**
   * Interface for an item in the navigation dropdown menus
   */
  export interface MenuItem {
    id: string;
    label: string;
    path?: string;
    icon?: string;
    subItems?: MenuItem[];
    action?: () => void;
  }
  
  /**
   * Interface for the "New" dropdown menu structure
   */
  export interface NewMenuItems {
    newChat: MenuItem[];
    workflowCreation: MenuItem;
    schedulerCreation: MenuItem;
    more: MenuItem;
  }
  
  /**
   * Interface for the "Manage Chats" dropdown menu structure
   */
  export interface ManageChatsMenuItems {
    baseChat: MenuItem;
    sequentialChat: MenuItem;
    requirementsChat: MenuItem;
    workflowCreation: MenuItem;
    schedulerCreation: MenuItem;
    manageAll: MenuItem;
  }
  
  /**
   * Interface for the "Dashboards" dropdown menu structure
   */
  export interface DashboardMenuItems {
    workflows: MenuItem;
    scheduler: MenuItem;
  }
  
  /**
   * Interface representing the status of an API
   */
  export interface ApiStatus {
    id: string;
    name: string;
    isAvailable: boolean;
    latency?: number;
    lastChecked: Date;
    errorMessage?: string;
  }
  
  /**
   * Interface for the homepage banner
   */
  export interface HomeBanner {
    newMenu: NewMenuItems;
    manageChatsMenu: ManageChatsMenuItems;
    dashboardsMenu: DashboardMenuItems;
    selectedApi: string;
    apiStatuses: ApiStatus[];
  }
  
  /**
   * Interface for a column in the homepage's three-column layout
   */
  export interface HomeColumn {
    title: string;
    chatType: ChatType;
    recentChats: RecentChat[];
    onNewChat: () => void;
  }
  
  /**
   * Props interface for the HomePage component
   */
  export interface HomePageProps {
    banner: HomeBanner;
    columns: HomeColumn[];
    isLoading?: boolean;
  }
  
  /**
   * Props interface for the MainBanner component
   */
  export interface MainBannerProps {
    /** Callback for creating a new chat */
    onNewChat: (type: ChatType) => "/new-chat";
    
    /** Callback for managing existing chats */
    onManageChats: (type: ChatType) => void;
    
    /** Callback for opening settings */
    onOpenSettings: () => void;
    
    /** Optional class name for styling */
    className?: string;
    
    /** Optional initial selected API */
    defaultSelectedApi?: string;
    
    /** Optional callback when API selection changes */
    onApiSelect?: (apiKey: string) => void;
    selectedApi: string;
  }
  
  /**
   * Interface for organizing chat sections on the homepage
   */
  export interface ChatSection {
    type: ChatType;
    title: string;
    chats: RecentChat[];
    maxDisplay: number;
  }
  
  /**
   * Type for tracking API configuration status
   */
  export interface ApiConfiguration {
    id: string;
    name: string;
    isConfigured: boolean;
    lastUpdated: Date;
    apiKey?: string;
  }
  
  /**
   * Type for any error states in the homepage components
   */
  export interface HomePageError {
    code: string;
    message: string;
    component?: string;
    timestamp: Date;
    details?: Record<string, unknown>;
  }