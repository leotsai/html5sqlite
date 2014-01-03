(function() {
    nova.data.Repository = function(db, type, table) {
        this.db = db;
        this.type = type;
        this.table = table;
        this.pendingAddEntities = [];
        this.pendingDeleteEntities = [];
        this.pendingUpdateEntities = [];
    };

    nova.data.Repository.prototype = {
        toArray: function(callback) {
            var query = new nova.data.Queryable(this);
            query.toArray(callback);
        },
        add: function(entity) {
            this.pendingAddEntities.push(entity);
        },
        remove: function(entity) {
            this.pendingDeleteEntities.push(entity);
        },
        removeByWhere: function(expression, successCallback, errorCallback) {
            var where = expression == null || expression == '' ? '' : ' where ' + expression;
            this.db.executeSql('delete from ' + this.table + where, successCallback, errorCallback);
        },
        removeAll: function(successCallback, errorCallback) {
            this.removeByWhere('', successCallback, errorCallback);
        },
        update: function(entity) {
            this.pendingUpdateEntities.push(entity);
        },
        where: function(expression) {
            return new nova.data.Queryable(this, expression);
        },
        orderBy: function(expression) {
            return new nova.data.Queryable(this).orderBy(expression);
        },
        firstOrDefault: function(callback, expression) {
            return new nova.data.Queryable(this).firstOrDefault(callback, expression);
        },
        thenBy: function(expression) {
            return new nova.data.Queryable(this).thenBy(expression);
        },
        get: function(id, callback) {
            var query = new nova.data.Queryable(this, "id=" + id);
            query.toArray(function(entities) {
                callback(entities.firstOrDefault());
            });
        },
        getFields: function() {
            var instance = new this.type();
            return instance.getFields();
        }
    };
})();
