var User = function () {
    nova.data.Entity.call(this);
    this.username = "";
    this.birthYear = 0;
    this.isDisabled = false;
    this.createdTime = new Date();
    this.lastUpdatedTime = new Date();
};

User.prototype = new nova.data.Entity();
User.constructor = User;

User.prototype.updateFrom = function(user) {
    this.username = user.username;
    this.birthYear = user.birthYear;
    this.isDisabled = user.isDisabled;
    this.lastUpdatedTime = new Date();
};