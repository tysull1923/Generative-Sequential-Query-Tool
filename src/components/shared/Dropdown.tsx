import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

/**
 * Interface for dropdown menu items
 */
export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  items?: DropdownItem[];
  path?: string;
}

/**
 * Props interface for the Dropdown component
 */
export interface DropdownProps {
  /** Array of dropdown menu items */
  items: DropdownItem[];
  /** Element that triggers the dropdown */
  trigger: React.ReactNode;
  /** Placement of the dropdown relative to the trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom class name for styling */
  className?: string;
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Callback for when the open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * A reusable dropdown component that supports nested menus and keyboard navigation
 * 
 * @example
 * const items = [
 *   {
 *     label: 'New Chat',
 *     items: [
 *       { label: 'Base Chat', onClick: () => {} },
 *       { label: 'Sequential Chat', onClick: () => {} }
 *     ]
 *   }
 * ];
 * 
 * <Dropdown
 *   items={items}
 *   trigger={<Button>Open Menu</Button>}
 *   placement="bottom"
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 */
export const Dropdown: React.FC<DropdownProps> = ({
  items,
  trigger,
  placement = 'bottom',
  className = '',
  isOpen,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [portalContainer] = useState(() => document.createElement('div'));

  /**
   * Calculate dropdown position based on trigger element and placement
   */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom':
        top = triggerRect.bottom + scrollY;
        left = triggerRect.left + scrollX;
        break;
      case 'top':
        top = triggerRect.top - dropdownRect.height + scrollY;
        left = triggerRect.left + scrollX;
        break;
      case 'left':
        top = triggerRect.top + scrollY;
        left = triggerRect.left - dropdownRect.width + scrollX;
        break;
      case 'right':
        top = triggerRect.top + scrollY;
        left = triggerRect.right + scrollX;
        break;
    }

    setPosition({ top, left });
  }, [placement]);

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        onOpenChange(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange, updatePosition]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        onOpenChange(false);
        setActiveSubmenu(null);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActiveSubmenu(prev => (prev === null ? 0 : (prev + 1) % items.length));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveSubmenu(prev => (prev === null ? items.length - 1 : (prev - 1 + items.length) % items.length));
        break;
      case 'Enter':
        if (activeSubmenu !== null) {
          const item = items[activeSubmenu];
          if (item.onClick) item.onClick();
          if (item.path) navigate(item.path);
          if (!item.items) {
            onOpenChange(false);
            setActiveSubmenu(null);
          }
        }
        break;
    }
  }, [items, activeSubmenu, onOpenChange, navigate]);

  /**
   * Handle menu item click
   */
  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    if (item.path) navigate(item.path);
    if (!item.items) {
      onOpenChange(false);
      setActiveSubmenu(null);
    }
  };

  /**
   * Render menu items recursively
   */
  const renderItems = (menuItems: DropdownItem[], level: number = 0) => {
    return (
      <ul
        className={cn(
          'py-1 rounded-md shadow-lg bg-white',
          level === 0 ? 'min-w-[200px]' : 'min-w-[180px]',
          className
        )}
        role="menu"
        aria-orientation="vertical"
      >
        {menuItems.map((item, index) => (
          <li
            key={item.label}
            className={cn(
              'relative',
              item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
            role="menuitem"
            tabIndex={-1}
          >
            <div
              className={cn(
                'flex items-center px-4 py-2 text-sm text-gray-700',
                'hover:bg-gray-100 focus:bg-gray-100',
                activeSubmenu === index && 'bg-gray-100',
                item.disabled && 'pointer-events-none'
              )}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setActiveSubmenu(index)}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span className="flex-grow">{item.label}</span>
              {item.items && <ChevronRight className="w-4 h-4 ml-2" />}
            </div>

            {/* Nested submenu */}
            {item.items && activeSubmenu === index && (
              <div
                className="absolute top-0 left-full ml-1"
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                {renderItems(item.items, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  useEffect(() => {
    document.body.appendChild(portalContainer);
    return () => {
      document.body.removeChild(portalContainer);
    };
  }, [portalContainer]);

  return (
    <>
      <div ref={triggerRef}>
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 animate-in fade-in duration-200"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
            onKeyDown={handleKeyDown}
          >
            {renderItems(items)}
          </div>,
          portalContainer
        )}
    </>
  );
};

export default Dropdown;
