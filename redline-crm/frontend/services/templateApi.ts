import apiClient from './apiClient';

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

export const templateApi = {
    getAll: async (): Promise<Template[]> => {
        const { data } = await apiClient.get('/templates');
        
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
        const { data } = await apiClient.post('/templates', template);

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
        const { data } = await apiClient.put(`/templates/${id}`, template);

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
        await apiClient.delete(`/templates/${id}`);
    },

    applyVariables: async (id: string, variables: Record<string, string>): Promise<string> => {
        const { data } = await apiClient.post(`/templates/${id}/apply`, { variables });

        if (!data.success) {
            throw new Error(data.message || 'Failed to apply variables');
        }
        
        return data.data; 
    }
};
