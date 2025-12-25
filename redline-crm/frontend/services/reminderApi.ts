export interface Reminder {
    id: string;
    contactId?: string;
    contactName?: string; // Derived from contactId if populated, or separate if backend sends it
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
    dueDate: string; // ISO Date string
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

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export const reminderApi = {
    getAll: async (params?: { status?: string, type?: string, priority?: string }): Promise<Reminder[]> => {
        const query = new URLSearchParams(params as any).toString();
        const response = await fetch(`${API_URL}/reminders?${query}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch reminders');
        }

        // Access the 'data' property which contains the array of reminders
        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id, // Ensure ID is mapped
            dueDate: new Date(item.dueDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            // Map contact name if contact is populated
            contactName: item.contactId && typeof item.contactId === 'object' ? 
                `${item.contactId.firstName} ${item.contactId.lastName}` : 'Unknown Contact'
        }));
    },

    create: async (reminder: CreateReminderDTO): Promise<Reminder> => {
        const response = await fetch(`${API_URL}/reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminder),
        });
        const data = await response.json();

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
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminder),
        });
        const data = await response.json();

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
        const response = await fetch(`${API_URL}/reminders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const data = await response.json();

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
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok && response.status !== 204) {
             const data = await response.json().catch(() => ({}));
             throw new Error(data.message || 'Failed to delete reminder');
        }
    },

    getOverdue: async (): Promise<Reminder[]> => {
        const response = await fetch(`${API_URL}/reminders/overdue`);
        const data = await response.json();
        
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
        const response = await fetch(`${API_URL}/reminders/today`);
        const data = await response.json();
        
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
        const response = await fetch(`${API_URL}/reminders/upcoming`);
        const data = await response.json();
        
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
