import Types "common";

module {
  public type ClientStatus = {
    clientId    : Text;
    name        : Text;
    connected   : Bool;
    phone       : ?Text;
    lastSeenAt  : ?Types.Timestamp;
  };
};
