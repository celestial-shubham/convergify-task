export interface IChat {
    id: number;
    uuid: string;
    name?: string;
    description?: string;
    isGroup: boolean;
    createdBy?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChatParticipant {
    id: number;
    chatId: number;
    userId: number;
    joinedAt: Date;
    role: string;
    isActive: boolean;
}