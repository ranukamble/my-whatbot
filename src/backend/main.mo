import Map "mo:core/Map";
import ContactsLib "lib/contacts";
import CampaignsLib "lib/campaigns";
import LogsLib "lib/logs";
import ClientsLib "lib/clients";
import GroupsLib "lib/groups";
import StatsLib "lib/stats";
import Common "types/common";
import TC "types/contacts";
import TK "types/campaigns";
import TL "types/logs";
import TI "types/clients";
import ContactsMixin "mixins/contacts-api";
import CampaignsMixin "mixins/campaigns-api";
import LogsMixin "mixins/logs-api";
import ClientsMixin "mixins/clients-api";
import GroupsMixin "mixins/groups-api";
import StatsMixin "mixins/stats-api";

actor {
  // --- Contacts state ---
  let contactsState : ContactsLib.State = {
    lists    = Map.empty<Common.Id, TC.ContactList>();
    contacts = Map.empty<Common.Id, TC.Contact>();
    counters = { var nextListId = 0; var nextContactId = 0 };
  };

  // --- Campaigns state (shares logs map with logsState) ---
  let sharedLogsMap    = Map.empty<Common.Id, TL.MessageLog>();
  let sharedLogCounter = { var nextId = 0 };

  let campaignsState : CampaignsLib.State = {
    campaigns  = Map.empty<Common.Id, TK.Campaign>();
    counter    = { var nextId = 0 };
    logs       = sharedLogsMap;
    logCounter = sharedLogCounter;
  };

  // --- Logs state (shares same map as campaigns) ---
  let logsState : LogsLib.State = {
    logs    = sharedLogsMap;
    counter = sharedLogCounter;
  };

  // --- Clients state ---
  let clientsState : ClientsLib.State = {
    clients = Map.empty<Text, TI.ClientStatus>();
  };

  // Initialize default 4 clients on startup
  ClientsLib.initDefaultClients(clientsState);

  // --- Groups (shares contacts state) ---
  let groupsContactsState : GroupsLib.ContactsState = {
    contacts = contactsState.contacts;
    counters = contactsState.counters;
  };

  // --- Stats state ---
  let statsState : StatsLib.State = {
    contactLists = contactsState.lists;
    campaigns    = campaignsState.campaigns;
    clients      = clientsState.clients;
  };

  // --- Mixin inclusions ---
  include ContactsMixin(contactsState);
  include CampaignsMixin(campaignsState, contactsState);
  include LogsMixin(logsState);
  include ClientsMixin(clientsState);
  include GroupsMixin(groupsContactsState);
  include StatsMixin(statsState);
};

