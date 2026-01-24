import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex-1 flex flex-col items-center justify-center px-6 py-20',
        className
      )}
    >
      {icon && <div className="w-24 h-24 mb-6 text-gray-200">{icon}</div>}

      <h2 className="text-[18px] font-bold text-gray-900 mb-2 text-center">
        {title}
      </h2>

      {description && (
        <p className="text-[15px] text-gray-500 text-center mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 rounded-xl active:bg-blue-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
