import Common "../types/common";
import T "../types/campaigns";
import CampaignsLib "../lib/campaigns";
import ContactsLib "../lib/contacts";

mixin (
  campaignsState : CampaignsLib.State,
  contactsState  : ContactsLib.State
) {
  public func createCampaign(req : T.CampaignRequest) : async Common.Id {
    let contacts = ContactsLib.getContactsInList(contactsState, req.listId);
    CampaignsLib.createCampaign(campaignsState, req, contacts.size());
  };

  public query func getCampaigns() : async [T.Campaign] {
    CampaignsLib.getCampaigns(campaignsState);
  };

  public func startCampaign(id : Common.Id) : async Bool {
    let contacts = switch (campaignsState.campaigns.get(id)) {
      case null { [] };
      case (?c) { ContactsLib.getContactsInList(contactsState, c.listId) };
    };
    CampaignsLib.startCampaign(campaignsState, id, contacts);
  };

  public func pauseCampaign(id : Common.Id) : async Bool {
    CampaignsLib.pauseCampaign(campaignsState, id);
  };

  public func deleteCampaign(id : Common.Id) : async Bool {
    CampaignsLib.deleteCampaign(campaignsState, id);
  };
};
