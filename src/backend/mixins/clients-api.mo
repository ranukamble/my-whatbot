import T "../types/clients";
import ClientsLib "../lib/clients";

mixin (
  clientsState : ClientsLib.State
) {
  public query func getClientStatuses() : async [T.ClientStatus] {
    ClientsLib.getClientStatuses(clientsState);
  };

  public func connectClient(clientId : Text) : async Bool {
    ClientsLib.connectClient(clientsState, clientId);
  };

  public func disconnectClient(clientId : Text) : async Bool {
    ClientsLib.disconnectClient(clientsState, clientId);
  };

  public func updateClientStatus(clientId : Text, connected : Bool, phone : ?Text) : async Bool {
    ClientsLib.updateClientStatus(clientsState, clientId, connected, phone);
  };
};
