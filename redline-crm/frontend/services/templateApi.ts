export interface Template {
    id: string;
    name: string;
    category: 'proposal' | 'follow-up' | 'welcome' | 'custom';
    subject?: string;
    content: string;
    variables: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTemplateDTO {
    name: string;
    category: string;
    subject?: string;
    content: string;
}

export interface UpdateTemplateDTO {
    name?: string;
    category?: string;
    subject?: string;
    content?: string;
}

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export const templateApi = {
    getAll: async (): Promise<Template[]> => {
        const response = await fetch(`${API_URL}/templates`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch templates');
        }

        return data.data.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    },

    create: async (template: CreateTemplateDTO): Promise<Template> => {
        const response = await fetch(`${API_URL}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to create template');
        }

        const item = data.data;
        return {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    },

    update: async (id: string, template: UpdateTemplateDTO): Promise<Template> => {
        const response = await fetch(`${API_URL}/templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to update template');
        }

        const item = data.data;
        return {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/templates/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok && response.status !== 204) {
             const data = await response.json().catch(() => ({}));
             throw new Error(data.message || 'Failed to delete template');
        }
    },

    applyVariables: async (id: string, variables: Record<string, string>): Promise<string> => {
        const response = await fetch(`${API_URL}/templates/${id}/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables }),
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to apply variables');
        }
        
        return data.data; // Returns the processed content string
    }
};
