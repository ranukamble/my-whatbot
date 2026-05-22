import type { Backend, CampaignRequest, ContactInput, MessageFilter } from '@/backend';
import {
  CampaignStatus,
  MessageStatus,
  MessageType,
} from '@/backend';
import type {
  Campaign,
  ClientStatus,
  Contact,
  ContactList,
  DashboardStats,
  GroupContact,
  MessageLog,
} from '@/types';

export { CampaignStatus, MessageStatus, MessageType };

function idToNumber(id: bigint): number {
  return Number(id);
}

function numberToId(n: number): bigint {
  return BigInt(n);
}

function timestampToNumber(ts: bigint): number {
  return Number(ts);
}

function optionalTimestampToNumber(ts?: bigint): number | undefined {
  return ts === undefined ? undefined : Number(ts);
}

function convertContactList(cl: import('@/backend').ContactList): ContactList {
  return {
    id: idToNumber(cl.id),
    name: cl.name,
    description: cl.description,
    createdAt: timestampToNumber(cl.createdAt),
  };
}

function convertContact(c: import('@/backend').Contact): Contact {
  return {
    id: idToNumber(c.id),
    name: c.name,
    phone: c.phone,
    listId: idToNumber(c.listId),
    createdAt: timestampToNumber(c.createdAt),
  };
}

function convertCampaign(c: import('@/backend').Campaign): Campaign {
  return {
    id: idToNumber(c.id),
    name: c.name,
    listId: idToNumber(c.listId),
    clientIds: c.clientIds,
    message: c.message,
    messageType: c.messageType,
    mediaPath: c.mediaPath,
    delaySecs: Number(c.delaySecs),
    status: c.status,
    sentCount: Number(c.sentCount),
    totalCount: Number(c.totalCount),
    createdAt: timestampToNumber(c.createdAt),
    startedAt: optionalTimestampToNumber(c.startedAt),
    scheduledAt: optionalTimestampToNumber(c.scheduledAt),
  };
}

function convertMessageLog(ml: import('@/backend').MessageLog): MessageLog {
  return {
    id: idToNumber(ml.id),
    campaignId: idToNumber(ml.campaignId),
    contactId: idToNumber(ml.contactId),
    phone: ml.phone,
    messagePreview: ml.messagePreview,
    status: ml.status,
    error: ml.error,
    sentAt: timestampToNumber(ml.sentAt),
  };
}

function convertClientStatus(cs: import('@/backend').ClientStatus): ClientStatus {
  return {
    clientId: cs.clientId,
    name: cs.name,
    connected: cs.connected,
    phone: cs.phone,
    lastSeenAt: optionalTimestampToNumber(cs.lastSeenAt),
  };
}

function convertDashboardStats(ds: import('@/backend').DashboardStats): DashboardStats {
  return {
    totalContactLists: Number(ds.totalContactLists),
    totalCampaigns: Number(ds.totalCampaigns),
    runningCampaigns: Number(ds.runningCampaigns),
    connectedClients: Number(ds.connectedClients),
    totalClients: Number(ds.totalClients),
  };
}

function convertGroupContact(gc: import('@/backend').GroupContact): GroupContact {
  return {
    name: gc.name,
    phone: gc.phone,
    isAdmin: gc.isAdmin,
  };
}

export async function getClientStatuses(backend: Backend): Promise<ClientStatus[]> {
  const statuses = await backend.getClientStatuses();
  return statuses.map(convertClientStatus);
}

export async function getContactLists(backend: Backend): Promise<ContactList[]> {
  const lists = await backend.getContactLists();
  return lists.map(convertContactList);
}

export async function createContactList(backend: Backend, name: string, description: string): Promise<number> {
  const id = await backend.createContactList(name, description);
  return idToNumber(id);
}

export async function deleteContactList(backend: Backend, id: number): Promise<boolean> {
  return backend.deleteContactList(numberToId(id));
}

export async function getContactsInList(backend: Backend, listId: number): Promise<Contact[]> {
  const contacts = await backend.getContactsInList(numberToId(listId));
  return contacts.map(convertContact);
}

export async function addContact(backend: Backend, listId: number, name: string, phone: string): Promise<number> {
  const id = await backend.addContact(numberToId(listId), name, phone);
  return idToNumber(id);
}

export async function deleteContact(backend: Backend, id: number): Promise<boolean> {
  return backend.deleteContact(numberToId(id));
}

export async function importContacts(backend: Backend, listId: number, contacts: ContactInput[]): Promise<number> {
  const count = await backend.importContacts(numberToId(listId), contacts);
  return Number(count);
}

export async function getCampaigns(backend: Backend): Promise<Campaign[]> {
  const campaigns = await backend.getCampaigns();
  return campaigns.map(convertCampaign);
}

export async function createCampaign(backend: Backend, req: CampaignRequest): Promise<number> {
  const id = await backend.createCampaign(req);
  return idToNumber(id);
}

export async function startCampaign(backend: Backend, id: number): Promise<boolean> {
  return backend.startCampaign(numberToId(id));
}

export async function pauseCampaign(backend: Backend, id: number): Promise<boolean> {
  return backend.pauseCampaign(numberToId(id));
}

export async function deleteCampaign(backend: Backend, id: number): Promise<boolean> {
  return backend.deleteCampaign(numberToId(id));
}

export async function getMessageHistory(backend: Backend, filter: MessageFilter): Promise<MessageLog[]> {
  const logs = await backend.getMessageLogs(filter);
  return logs.map(convertMessageLog);
}

export async function getDashboardStats(backend: Backend): Promise<DashboardStats> {
  const stats = await backend.getDashboardStats();
  return convertDashboardStats(stats);
}

export async function extractGroupContacts(backend: Backend, groupId: string, clientId: string): Promise<GroupContact[]> {
  const contacts = await backend.extractGroupContacts(groupId, clientId);
  return contacts.map(convertGroupContact);
}

export async function saveGroupContactsToList(backend: Backend, listId: number, contacts: ContactInput[]): Promise<number> {
  const count = await backend.saveGroupContactsToList(numberToId(listId), contacts);
  return Number(count);
}

export async function connectClient(backend: Backend, clientId: string): Promise<boolean> {
  return backend.connectClient(clientId);
}

export async function disconnectClient(backend: Backend, clientId: string): Promise<boolean> {
  return backend.disconnectClient(clientId);
}
