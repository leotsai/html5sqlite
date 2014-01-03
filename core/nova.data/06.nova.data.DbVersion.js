(function() {
    nova.data.DbVersion = function() {
        nova.data.Entity.call(this);
        this.version = 0;
    };
    nova.data.DbVersion.prototype = new nova.data.Entity();
    nova.data.DbVersion.constructor = nova.data.DbVersion;
})();