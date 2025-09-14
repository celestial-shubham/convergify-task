export interface IMessage {
    id: number;
    uuid: string;
    chatId: number;
    senderId: number;
    content: string;
    messageType: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;
    isDeleted: boolean;
}

export interface IMessageWithDetails extends IMessage {
    chatUuid: string;
    senderUuid: string;
    senderUsername: string;
}
