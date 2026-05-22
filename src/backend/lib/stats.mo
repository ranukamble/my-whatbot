import Map "mo:core/Map";
import Common "../types/common";
import TC "../types/campaigns";
import TS "../types/stats";
import TContact "../types/contacts";
import TClient "../types/clients";

module {
  public type State = {
    contactLists : Map.Map<Common.Id, TContact.ContactList>;
    campaigns    : Map.Map<Common.Id, TC.Campaign>;
    clients      : Map.Map<Text, TClient.ClientStatus>;
  };

  public func getDashboardStats(state : State) : TS.DashboardStats {
    var runningCampaigns = 0;
    for ((_, c) in state.campaigns.entries()) {
      if (c.status == #running) { runningCampaigns += 1 };
    };
    var connectedClients = 0;
    for ((_, cs) in state.clients.entries()) {
      if (cs.connected) { connectedClients += 1 };
    };
    {
      totalContactLists = state.contactLists.size();
      totalCampaigns    = state.campaigns.size();
      runningCampaigns;
      connectedClients;
      totalClients = 4;
    };
  };
};
