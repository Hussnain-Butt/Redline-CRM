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
    isStarred?: boolean; // Frontend only, unless added to backend
    isRead?: boolean;    // Frontend only, unless added to backend
}

export interface CreateEmailDTO {
    to: string[];
    subject: string;
    body: string;
    contactId?: string;
    from?: string; // Optional, backend might default it
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const emailApi = {
    getAll: async (params?: { status?: string, contactId?: string }): Promise<Email[]> => {
        const query = new URLSearchParams(params as any).toString();
        const response = await fetch(`${API_URL}/emails?${query}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch emails');
        }

        return data.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            to: Array.isArray(item.to) ? item.to : [item.to], // Ensure array
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        }));
    },

    create: async (email: CreateEmailDTO): Promise<Email> => {
        const payload = {
            ...email,
            from: email.from || 'me@redline.com', // Default from if not provided
            status: 'sent', // Simulate sending immediately
            direction: 'outbound'
        };

        const response = await fetch(`${API_URL}/emails/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

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
