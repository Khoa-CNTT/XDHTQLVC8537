import React from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export const AdminActionButtons = ({ onEdit, onDelete }) => {
    return (
        <div className="admin-table-actions">
            <button
                onClick={onEdit}
                className="admin-table-button admin-table-button-edit"
                title="Sửa"
            >
                <PencilIcon className="h-5 w-5" />
            </button>
            <button
                onClick={onDelete}
                className="admin-table-button admin-table-button-delete"
                title="Xóa"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export const AdminAddButton = ({ onClick, text = "Thêm mới" }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="admin-add-button"
        >
            <PlusIcon className="h-5 w-5 mr-2" />
            {text}
        </button>
    );
};
