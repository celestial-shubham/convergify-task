export interface IUser {
    id: number;        // SERIAL primary key
    uuid: string;      // UUID for GraphQL ID
    username: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    lastSeen?: Date;
    isActive: boolean;
}