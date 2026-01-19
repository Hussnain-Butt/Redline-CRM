import apiClient from './apiClient';

export interface Email {
    id: string;
    contactId?: string;
    to: string[];
    from: string;
    subject: string;
    body: string;
    text?: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    direction: 'inbound' | 'outbound';
    createdAt: Date;
    updatedAt: Date;
    isStarred?: boolean;
    isRead?: boolean;
}

export interface CreateEmailDTO {
    to: string[];
    subject: string;
    body: string;
    contactId?: string;
    from?: string;
}

export const emailApi = {
    getAll: async (params?: { status?: string, contactId?: string }): Promise<Email[]> => {
        const { data } = await apiClient.get('/emails', { params });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch emails');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            to: Array.isArray(item.to) ? item.to : [item.to],
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    },

    create: async (email: CreateEmailDTO): Promise<Email> => {
        const payload = {
            ...email,
            from: email.from || 'me@redline.com',
            status: 'sent',
            direction: 'outbound'
        };

        const { data } = await apiClient.post('/emails/send', payload);

        if (!data.success) {
            throw new Error(data.message || 'Failed to send email');
        }

        const item = data.data;
        return {
            ...item,
            id: item.id || item._id,
            to: Array.isArray(item.to) ? item.to : [item.to],
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    }
};
