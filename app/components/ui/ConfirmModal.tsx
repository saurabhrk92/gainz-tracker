'use client';

import { UIIcon } from './Icon';
import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger' as const;
      case 'warning':
        return 'primary' as const;
      case 'info':
        return 'primary' as const;
      default:
        return 'danger' as const;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="text-4xl mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-4">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={getButtonVariant()}
            size="md"
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}