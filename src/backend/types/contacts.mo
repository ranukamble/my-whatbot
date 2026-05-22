import Types "common";

module {
  public type ContactList = {
    id      : Types.Id;
    name    : Text;
    description : Text;
    createdAt   : Types.Timestamp;
  };

  public type Contact = {
    id     : Types.Id;
    listId : Types.Id;
    name   : Text;
    phone  : Text;
    createdAt : Types.Timestamp;
  };

  public type ContactInput = {
    name  : Text;
    phone : Text;
  };
};
