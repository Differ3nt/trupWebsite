import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ children, content, className, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <div 
      ref={triggerRef}
      className="inline-flex items-center leading-none"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                x: position === 'right' ? -10 : position === 'left' ? 10 : '-50%',
                y: position === 'bottom' ? -10 : position === 'top' ? 10 : '-50%'
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: position === 'right' ? 0 : position === 'left' ? 0 : '-50%',
                y: position === 'bottom' ? 0 : position === 'top' ? 0 : '-50%'
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.9, 
                x: position === 'right' ? -10 : position === 'left' ? 10 : '-50%',
                y: position === 'bottom' ? -10 : position === 'top' ? 10 : '-50%'
              }}
              className={cn(
                "fixed z-[9999] pointer-events-none",
                className
              )}
              style={{ 
                top: coords.top, 
                left: coords.left,
                transform: 
                  position === 'top' ? 'translate(-50%, -100%)' :
                  position === 'bottom' ? 'translate(-50%, 0)' :
                  position === 'left' ? 'translate(-100%, -50%)' :
                  'translate(0, -50%)'
              }}
            >
              <div className={cn(
                "bg-[#1A1C18] border-2 border-primary/40 p-4 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)] min-w-[200px] relative",
                position === 'top' && "mb-3",
                position === 'bottom' && "mt-3",
                position === 'left' && "mr-3",
                position === 'right' && "ml-3"
              )}>
                {/* Arrow / Dziubek - Centered on the edge and pointing to trigger */}
                <div 
                  className={cn(
                    "absolute w-3 h-3 bg-[#1A1C18] rotate-45 z-0",
                    position === 'top' && "bottom-[-7.5px] left-1/2 -translate-x-1/2 border-r-2 border-b-2 border-primary/40",
                    position === 'bottom' && "top-[-7.5px] left-1/2 -translate-x-1/2 border-l-2 border-t-2 border-primary/40",
                    position === 'left' && "right-[-7.5px] top-1/2 -translate-y-1/2 border-r-2 border-t-2 border-primary/40",
                    position === 'right' && "left-[-7.5px] top-1/2 -translate-y-1/2 border-l-2 border-b-2 border-primary/40"
                  )}
                />
                <div className="relative z-10">
                  {content}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
