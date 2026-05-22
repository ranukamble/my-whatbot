import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Common "../types/common";
import T "../types/clients";

module {
  public type State = {
    clients : Map.Map<Text, T.ClientStatus>;
  };

  public func initDefaultClients(state : State) : () {
    let defaultIds = ["client1", "client2", "client3", "client4"];
    var i = 1;
    for (clientId in defaultIds.vals()) {
      switch (state.clients.get(clientId)) {
        case (?_) { /* already exists */ };
        case null {
          let entry : T.ClientStatus = {
            clientId;
            name       = "Profile " # i.toText();
            connected  = false;
            phone      = null;
            lastSeenAt = null;
          };
          state.clients.add(clientId, entry);
        };
      };
      i += 1;
    };
  };

  public func getClientStatuses(state : State) : [T.ClientStatus] {
    let order = ["client1", "client2", "client3", "client4"];
    var result = List.empty<T.ClientStatus>();
    for (clientId in order.vals()) {
      switch (state.clients.get(clientId)) {
        case (?cs) { result.add(cs) };
        case null {};
      };
    };
    result.toArray();
  };

  public func connectClient(state : State, clientId : Text) : Bool {
    switch (state.clients.get(clientId)) {
      case null { false };
      case (?cs) {
        // derive a deterministic mock phone from clientId index
        let suffix = switch (clientId) {
          case "client1" { "9000000001" };
          case "client2" { "9000000002" };
          case "client3" { "9000000003" };
          case "client4" { "9000000004" };
          case (_) { "9000000000" };
        };
        let phoneNum = "+91" # suffix;
        let updated : T.ClientStatus = {
          cs with
          connected  = true;
          phone      = ?phoneNum;
          lastSeenAt = ?Time.now();
        };
        state.clients.add(clientId, updated);
        true;
      };
    };
  };

  public func disconnectClient(state : State, clientId : Text) : Bool {
    switch (state.clients.get(clientId)) {
      case null { false };
      case (?cs) {
        let updated : T.ClientStatus = {
          cs with
          connected  = false;
          phone      = null;
        };
        state.clients.add(clientId, updated);
        true;
      };
    };
  };

  public func updateClientStatus(state : State, clientId : Text, connected : Bool, phone : ?Text) : Bool {
    switch (state.clients.get(clientId)) {
      case null { false };
      case (?cs) {
        let updated : T.ClientStatus = {
          cs with
          connected;
          phone;
          lastSeenAt = if (connected) { ?Time.now() } else { cs.lastSeenAt };
        };
        state.clients.add(clientId, updated);
        true;
      };
    };
  };
};
