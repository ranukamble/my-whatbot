import Common "../types/common";
import T "../types/contacts";
import ContactsLib "../lib/contacts";

mixin (
  contactsState : ContactsLib.State
) {
  public func createContactList(name : Text, description : Text) : async Common.Id {
    ContactsLib.createContactList(contactsState, name, description);
  };

  public query func getContactLists() : async [T.ContactList] {
    ContactsLib.getContactLists(contactsState);
  };

  public func deleteContactList(id : Common.Id) : async Bool {
    ContactsLib.deleteContactList(contactsState, id);
  };

  public func addContact(listId : Common.Id, name : Text, phone : Text) : async Common.Id {
    ContactsLib.addContact(contactsState, listId, name, phone);
  };

  public query func getContactsInList(listId : Common.Id) : async [T.Contact] {
    ContactsLib.getContactsInList(contactsState, listId);
  };

  public func deleteContact(id : Common.Id) : async Bool {
    ContactsLib.deleteContact(contactsState, id);
  };

  public func importContacts(listId : Common.Id, contacts : [T.ContactInput]) : async Nat {
    ContactsLib.importContacts(contactsState, listId, contacts);
  };
};
