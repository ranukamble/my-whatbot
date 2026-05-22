import Types "common";

module {
  public type CampaignStatus = {
    #pending;
    #running;
    #paused;
    #completed;
  };

  public type MessageType = {
    #text;
    #imageText;
    #videoText;
    #document;
  };

  public type CampaignRequest = {
    name       : Text;
    listId     : Types.Id;
    clientIds  : [Text];
    messageType : MessageType;
    message    : Text;
    mediaPath  : ?Text;
    delaySecs  : Nat;
    scheduledAt : ?Types.Timestamp;
  };

  public type Campaign = {
    id          : Types.Id;
    name        : Text;
    listId      : Types.Id;
    clientIds   : [Text];
    messageType : MessageType;
    message     : Text;
    mediaPath   : ?Text;
    delaySecs   : Nat;
    status      : CampaignStatus;
    sentCount   : Nat;
    totalCount  : Nat;
    createdAt   : Types.Timestamp;
    startedAt   : ?Types.Timestamp;
    scheduledAt : ?Types.Timestamp;
  };
};
