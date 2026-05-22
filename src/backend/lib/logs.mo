import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import T "../types/logs";

module {
  public type State = {
    logs    : Map.Map<Common.Id, T.MessageLog>;
    counter : { var nextId : Common.Id };
  };

  public func getMessageLogs(state : State, filter : T.MessageFilter) : [T.MessageLog] {
    var result = List.empty<T.MessageLog>();
    for ((_, log) in state.logs.entries()) {
      let matchCampaign = switch (filter.campaignId) {
        case null { true };
        case (?cid) { log.campaignId == cid };
      };
      let matchStatus = switch (filter.status) {
        case null { true };
        case (?st) { log.status == st };
      };
      let matchFrom = switch (filter.fromTime) {
        case null { true };
        case (?t) { log.sentAt >= t };
      };
      let matchTo = switch (filter.toTime) {
        case null { true };
        case (?t) { log.sentAt <= t };
      };
      if (matchCampaign and matchStatus and matchFrom and matchTo) {
        result.add(log);
      };
    };
    result.toArray();
  };

  public func addMessageLog(state : State, input : T.MessageLogInput) : Common.Id {
    let id = state.counter.nextId;
    state.counter.nextId += 1;
    let entry : T.MessageLog = {
      id;
      campaignId     = input.campaignId;
      contactId      = input.contactId;
      phone          = input.phone;
      messagePreview = input.messagePreview;
      status         = input.status;
      error          = input.error;
      sentAt         = Time.now();
    };
    state.logs.add(id, entry);
    id;
  };
};
