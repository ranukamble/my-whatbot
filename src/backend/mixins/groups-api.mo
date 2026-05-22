import Common "../types/common";
import TG "../types/groups";
import TC "../types/contacts";
import GroupsLib "../lib/groups";

mixin (
  groupsContactsState : GroupsLib.ContactsState
) {
  public func extractGroupContacts(groupId : Text, clientId : Text) : async [TG.GroupContact] {
    GroupsLib.extractGroupContacts(groupId, clientId);
  };

  public func saveGroupContactsToList(listId : Common.Id, contacts : [TC.ContactInput]) : async Nat {
    GroupsLib.saveGroupContactsToList(groupsContactsState, listId, contacts);
  };
};
