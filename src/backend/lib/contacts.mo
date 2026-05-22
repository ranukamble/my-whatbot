import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import T "../types/contacts";

module {
  public type State = {
    lists     : Map.Map<Common.Id, T.ContactList>;
    contacts  : Map.Map<Common.Id, T.Contact>;
    counters  : { var nextListId : Common.Id; var nextContactId : Common.Id };
  };

  public func createContactList(state : State, name : Text, description : Text) : Common.Id {
    let id = state.counters.nextListId;
    state.counters.nextListId += 1;
    let entry : T.ContactList = {
      id;
      name;
      description;
      createdAt = Time.now();
    };
    state.lists.add(id, entry);
    id;
  };

  public func getContactLists(state : State) : [T.ContactList] {
    var result = List.empty<T.ContactList>();
    for ((_, cl) in state.lists.entries()) {
      result.add(cl);
    };
    result.toArray();
  };

  public func deleteContactList(state : State, id : Common.Id) : Bool {
    if (state.lists.get(id) != null) {
      state.lists.remove(id);
      // remove all contacts in this list
      let toRemove = List.empty<Common.Id>();
      for ((cid, contact) in state.contacts.entries()) {
        if (contact.listId == id) { toRemove.add(cid) };
      };
      for (cid in toRemove.toArray().vals()) {
        state.contacts.remove(cid);
      };
      true;
    } else {
      false;
    };
  };

  public func addContact(state : State, listId : Common.Id, name : Text, phone : Text) : Common.Id {
    if (phone == "") { Runtime.trap("Phone must not be empty") };
    let id = state.counters.nextContactId;
    state.counters.nextContactId += 1;
    let entry : T.Contact = {
      id;
      listId;
      name;
      phone;
      createdAt = Time.now();
    };
    state.contacts.add(id, entry);
    id;
  };

  public func getContactsInList(state : State, listId : Common.Id) : [T.Contact] {
    var result = List.empty<T.Contact>();
    for ((_, contact) in state.contacts.entries()) {
      if (contact.listId == listId) { result.add(contact) };
    };
    result.toArray();
  };

  public func deleteContact(state : State, id : Common.Id) : Bool {
    if (state.contacts.get(id) != null) {
      state.contacts.remove(id);
      true;
    } else {
      false;
    };
  };

  public func importContacts(state : State, listId : Common.Id, inputs : [T.ContactInput]) : Nat {
    var count = 0;
    for (input in inputs.vals()) {
      if (input.phone != "") {
        let id = state.counters.nextContactId;
        state.counters.nextContactId += 1;
        let entry : T.Contact = {
          id;
          listId;
          name = input.name;
          phone = input.phone;
          createdAt = Time.now();
        };
        state.contacts.add(id, entry);
        count += 1;
      };
    };
    count;
  };
};
