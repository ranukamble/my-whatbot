import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Common "../types/common";
import T "../types/campaigns";
import TL "../types/logs";
import TContact "../types/contacts";

module {
  public type State = {
    campaigns : Map.Map<Common.Id, T.Campaign>;
    counter   : { var nextId : Common.Id };
    logs      : Map.Map<Common.Id, TL.MessageLog>;
    logCounter: { var nextId : Common.Id };
  };

  public func createCampaign(state : State, req : T.CampaignRequest, totalCount : Nat) : Common.Id {
    let id = state.counter.nextId;
    state.counter.nextId += 1;
    let entry : T.Campaign = {
      id;
      name        = req.name;
      listId      = req.listId;
      clientIds   = req.clientIds;
      messageType = req.messageType;
      message     = req.message;
      mediaPath   = req.mediaPath;
      delaySecs   = req.delaySecs;
      status      = #pending;
      sentCount   = 0;
      totalCount;
      createdAt   = Time.now();
      startedAt   = null;
      scheduledAt = req.scheduledAt;
    };
    state.campaigns.add(id, entry);
    id;
  };

  public func getCampaigns(state : State) : [T.Campaign] {
    var result = List.empty<T.Campaign>();
    for ((_, c) in state.campaigns.entries()) {
      result.add(c);
    };
    let arr = result.toArray();
    // sort by createdAt descending using Array.sort
    arr.sort<T.Campaign>(func(a, b) {
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else { #equal }
    });
  };

  public func startCampaign(state : State, id : Common.Id, contacts : [TContact.Contact]) : Bool {
    switch (state.campaigns.get(id)) {
      case null { false };
      case (?campaign) {
        let now = Time.now();
        let updated : T.Campaign = {
          campaign with
          status     = #running;
          startedAt  = ?now;
          totalCount = contacts.size();
          sentCount  = contacts.size();
        };
        state.campaigns.add(id, updated);
        // generate mock message logs for all contacts
        for (contact in contacts.vals()) {
          let logId = state.logCounter.nextId;
          state.logCounter.nextId += 1;
          let msg = campaign.message;
          let preview = if (msg.size() > 50) {
            var s = "";
            var i = 0;
            for (c in msg.chars()) {
              if (i < 50) { s #= Text.fromChar(c); i += 1 };
            };
            s # "..."
          } else { msg };
          let logEntry : TL.MessageLog = {
            id             = logId;
            campaignId     = id;
            contactId      = contact.id;
            phone          = contact.phone;
            messagePreview = preview;
            status         = #sent;
            error          = null;
            sentAt         = now;
          };
          state.logs.add(logId, logEntry);
        };
        true;
      };
    };
  };

  public func pauseCampaign(state : State, id : Common.Id) : Bool {
    switch (state.campaigns.get(id)) {
      case null { false };
      case (?campaign) {
        switch (campaign.status) {
          case (#running) {
            state.campaigns.add(id, { campaign with status = #paused });
            true;
          };
          case (_) { false };
        };
      };
    };
  };

  public func deleteCampaign(state : State, id : Common.Id) : Bool {
    if (state.campaigns.get(id) != null) {
      state.campaigns.remove(id);
      true;
    } else {
      false;
    };
  };
};
