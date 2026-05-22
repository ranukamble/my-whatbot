import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Common "../types/common";
import TG "../types/groups";
import TC "../types/contacts";
import Array "mo:core/Array";
import Char "mo:core/Char";
import Nat32 "mo:core/Nat32";

module {
  public type ContactsState = {
    contacts  : Map.Map<Common.Id, TC.Contact>;
    counters  : { var nextListId : Common.Id; var nextContactId : Common.Id };
  };

  public func extractGroupContacts(groupId : Text, clientId : Text) : [TG.GroupContact] {
    ignore clientId;
    // deterministic seed from group ID
    var seed : Nat = 0;
    for (c in groupId.chars()) { seed += c.toNat32().toNat() };
    let count = 10 + (seed % 11); // 10-20
    let result = Array.tabulate<TG.GroupContact>(count, func(i : Nat) {
      let s = seed + i * 1000;
      let lastDigits = (s % 10_000_000_000).toText();
      {
        name    = "Contact " # (i + 1).toText();
        phone   = "+91" # lastDigits;
        isAdmin = i < 3;
      }
    });
    result;
  };

  public func saveGroupContactsToList(state : ContactsState, listId : Common.Id, inputs : [TC.ContactInput]) : Nat {
    var count = 0;
    for (input in inputs.vals()) {
      if (input.phone != "") {
        let id = state.counters.nextContactId;
        state.counters.nextContactId += 1;
        let entry : TC.Contact = {
          id;
          listId;
          name      = input.name;
          phone     = input.phone;
          createdAt = Time.now();
        };
        state.contacts.add(id, entry);
        count += 1;
      };
    };
    count;
  };
};
