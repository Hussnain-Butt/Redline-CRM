import apiClient from './apiClient';

export interface Reminder {
    id: string;
    contactId?: string;
    contactName?: string;
    type: 'call' | 'email' | 'meeting' | 'task';
    title: string;
    notes?: string;
    dueDate: Date;
    dueTime?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'completed' | 'snoozed';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateReminderDTO {
    title: string;
    type: string;
    priority: string;
    dueDate: string;
    dueTime?: string;
    notes?: string;
    contactId?: string;
}

export interface UpdateReminderDTO {
    title?: string;
    type?: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
    notes?: string;
    status?: string;
}

export const reminderApi = {
    getAll: async (params?: { status?: string, type?: string, priority?: string }): Promise<Reminder[]> => {
        const { data } = await apiClient.get('/reminders', { params });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch reminders');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            contactName: item.contactId && typeof item.contactId === 'object' ? 
                `${item.contactId.firstName} ${item.contactId.lastName}` : 'Unknown Contact'
        }));
    },

    create: async (reminder: CreateReminderDTO): Promise<Reminder> => {
        const { data } = await apiClient.post('/reminders', reminder);

        if (!data.success) {
            throw new Error(data.message || 'Failed to create reminder');
        }

        const item = data.data;
        return {
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    },

    update: async (id: string, reminder: UpdateReminderDTO): Promise<Reminder> => {
        const { data } = await apiClient.put(`/reminders/${id}`, reminder);

        if (!data.success) {
            throw new Error(data.message || 'Failed to update reminder');
        }

        const item = data.data;
        return {
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    },

    updateStatus: async (id: string, status: 'pending' | 'completed' | 'snoozed'): Promise<Reminder> => {
        const { data } = await apiClient.patch(`/reminders/${id}/status`, { status });

        if (!data.success) {
            throw new Error(data.message || 'Failed to update reminder status');
        }

        const item = data.data;
        return {
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/reminders/${id}`);
    },

    getOverdue: async (): Promise<Reminder[]> => {
        const { data } = await apiClient.get('/reminders/overdue');
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch overdue reminders');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    },

    getToday: async (): Promise<Reminder[]> => {
        const { data } = await apiClient.get('/reminders/today');
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch today reminders');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    },
    
    getUpcoming: async (): Promise<Reminder[]> => {
        const { data } = await apiClient.get('/reminders/upcoming');
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch upcoming reminders');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    }
};
