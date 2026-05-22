import Types "common";

module {
  public type MessageStatus = {
    #sent;
    #failed;
  };

  public type MessageLog = {
    id           : Types.Id;
    campaignId   : Types.Id;
    contactId    : Types.Id;
    phone        : Text;
    messagePreview : Text;
    status       : MessageStatus;
    error        : ?Text;
    sentAt       : Types.Timestamp;
  };

  public type MessageLogInput = {
    campaignId   : Types.Id;
    contactId    : Types.Id;
    phone        : Text;
    messagePreview : Text;
    status       : MessageStatus;
    error        : ?Text;
  };

  public type MessageFilter = {
    campaignId : ?Types.Id;
    status     : ?MessageStatus;
    fromTime   : ?Types.Timestamp;
    toTime     : ?Types.Timestamp;
  };
};
