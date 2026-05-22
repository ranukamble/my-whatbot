import type { CampaignStatus, MessageStatus, MessageType } from "@/backend";

export type { CampaignStatus, MessageStatus, MessageType };

export interface ContactList {
  id: number;
  name: string;
  description: string;
  createdAt: number;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  listId: number;
  createdAt: number;
}

export interface Campaign {
  id: number;
  name: string;
  listId: number;
  clientIds: string[];
  message: string;
  messageType: MessageType;
  mediaPath?: string;
  delaySecs: number;
  status: CampaignStatus;
  sentCount: number;
  totalCount: number;
  createdAt: number;
  startedAt?: number;
  scheduledAt?: number;
}

export interface MessageLog {
  id: number;
  campaignId: number;
  contactId: number;
  phone: string;
  messagePreview: string;
  status: MessageStatus;
  error?: string;
  sentAt: number;
}

export interface ClientStatus {
  clientId: string;
  name: string;
  connected: boolean;
  phone?: string;
  lastSeenAt?: number;
}

export interface GroupContact {
  name: string;
  phone: string;
  isAdmin: boolean;
}

export interface DashboardStats {
  totalContactLists: number;
  totalCampaigns: number;
  runningCampaigns: number;
  connectedClients: number;
  totalClients: number;
}

export interface MessageFilter {
  status?: MessageStatus;
  campaignId?: number;
  fromTime?: number;
  toTime?: number;
}
