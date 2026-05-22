import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ContactInput {
    name: string;
    phone: string;
}
export type Timestamp = bigint;
export interface Contact {
    id: Id;
    name: string;
    createdAt: Timestamp;
    phone: string;
    listId: Id;
}
export interface MessageLog {
    id: Id;
    status: MessageStatus;
    messagePreview: string;
    campaignId: Id;
    sentAt: Timestamp;
    error?: string;
    contactId: Id;
    phone: string;
}
export interface MessageLogInput {
    status: MessageStatus;
    messagePreview: string;
    campaignId: Id;
    error?: string;
    contactId: Id;
    phone: string;
}
export interface DashboardStats {
    connectedClients: bigint;
    runningCampaigns: bigint;
    totalClients: bigint;
    totalCampaigns: bigint;
    totalContactLists: bigint;
}
export interface GroupContact {
    name: string;
    isAdmin: boolean;
    phone: string;
}
export interface ContactList {
    id: Id;
    name: string;
    createdAt: Timestamp;
    description: string;
}
export interface CampaignRequest {
    delaySecs: bigint;
    name: string;
    messageType: MessageType;
    message: string;
    mediaPath?: string;
    clientIds: Array<string>;
    listId: Id;
    scheduledAt?: Timestamp;
}
export interface Campaign {
    id: Id;
    status: CampaignStatus;
    startedAt?: Timestamp;
    delaySecs: bigint;
    name: string;
    createdAt: Timestamp;
    totalCount: bigint;
    sentCount: bigint;
    messageType: MessageType;
    message: string;
    mediaPath?: string;
    clientIds: Array<string>;
    listId: Id;
    scheduledAt?: Timestamp;
}
export type Id = bigint;
export interface MessageFilter {
    status?: MessageStatus;
    campaignId?: Id;
    toTime?: Timestamp;
    fromTime?: Timestamp;
}
export interface ClientStatus {
    clientId: string;
    lastSeenAt?: Timestamp;
    name: string;
    connected: boolean;
    phone?: string;
}
export enum CampaignStatus {
    pending = "pending",
    completed = "completed",
    running = "running",
    paused = "paused"
}
export enum MessageStatus {
    sent = "sent",
    failed = "failed"
}
export enum MessageType {
    imageText = "imageText",
    text = "text",
    videoText = "videoText",
    document_ = "document"
}
export interface backendInterface {
    addContact(listId: Id, name: string, phone: string): Promise<Id>;
    addMessageLog(log: MessageLogInput): Promise<Id>;
    connectClient(clientId: string): Promise<boolean>;
    createCampaign(req: CampaignRequest): Promise<Id>;
    createContactList(name: string, description: string): Promise<Id>;
    deleteCampaign(id: Id): Promise<boolean>;
    deleteContact(id: Id): Promise<boolean>;
    deleteContactList(id: Id): Promise<boolean>;
    disconnectClient(clientId: string): Promise<boolean>;
    extractGroupContacts(groupId: string, clientId: string): Promise<Array<GroupContact>>;
    getCampaigns(): Promise<Array<Campaign>>;
    getClientStatuses(): Promise<Array<ClientStatus>>;
    getContactLists(): Promise<Array<ContactList>>;
    getContactsInList(listId: Id): Promise<Array<Contact>>;
    getDashboardStats(): Promise<DashboardStats>;
    getMessageLogs(filter: MessageFilter): Promise<Array<MessageLog>>;
    importContacts(listId: Id, contacts: Array<ContactInput>): Promise<bigint>;
    pauseCampaign(id: Id): Promise<boolean>;
    saveGroupContactsToList(listId: Id, contacts: Array<ContactInput>): Promise<bigint>;
    startCampaign(id: Id): Promise<boolean>;
    updateClientStatus(clientId: string, connected: boolean, phone: string | null): Promise<boolean>;
}
