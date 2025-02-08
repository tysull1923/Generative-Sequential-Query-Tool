/**
 * Props interface for the MainHeader component
 */
export interface MainHeaderProps {
    /**
     * Optional className for additional styling
     */
    className?: string;
  }
  
  /**
   * Type for API selection
   */
  export type APIType = 'OpenAI' | 'Claude';
  
  /**
   * Interface for API status
   */
  export interface APIStatusProps {
    selectedAPI: APIType;
    onAPIChange?: (api: APIType) => void;
  }