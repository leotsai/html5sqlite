(function() {
    nova.data.DbContext.prototype.saveChanges = function(successCallback, errorCallback) {
        var obj = this;
        var sqlDelegates = [];
        var tables = this.getTables();
        for (var ti = 0; ti < tables.length; ti++) {
            var table = tables[ti];
            var query = this[table];
            if (query instanceof nova.data.Repository) {
                var fields = query.getFields();
                query.pendingDeleteEntities.each(function() {
                    var removeWhere = this;
                    if (this instanceof query.type) {
                        removeWhere = " where id=" + this.id;
                    }
                    var deleteSql = "delete from " + table + removeWhere;
                    sqlDelegates.push({
                        sql: deleteSql
                    });
                });

                query.pendingDeleteEntities = [];
                if (query.pendingAddEntities.any()) {
                    var columns = fields.select(function() {
                        return this.name;
                    }).join();

                    query.pendingAddEntities.each(function() {
                        var toAdd = this;
                        var values = [];
                        fields.each(function() {
                            if (this.name == "id") {
                                values.push("null");
                            } else {
                                values.push(nova.data.Entity.getDbValue(this.type, toAdd[this.name]));
                            }
                        });

                        var sqlInsert = "insert into " + table + " (" + columns + ") values (" + values.join() + ")";
                        sqlDelegates.push({
                            sql: sqlInsert,
                            entity: toAdd
                        });
                    });
                    query.pendingAddEntities = [];
                }

                query.pendingUpdateEntities.each(function() {
                    var toUpdate = this;
                    var sets = fields.where(function() {
                        return this.name != "id";
                    }).select(function() {
                        return this.name + "=" + nova.data.Entity.getDbValue(this.type, toUpdate[this.name]);
                    }).join();
                    var sqlUpdate = "update " + table + " set " + sets + " where id = " + toUpdate.id;
                    sqlDelegates.push({
                        sql: sqlUpdate
                    });
                });
                query.pendingUpdateEntities = [];
            }
        }
        if (this.db != null) {
            this.db.transaction(function(dbContext) {
                for (var s = 0; s < sqlDelegates.length; s++) {
                    var sqlDelegate = sqlDelegates[s];
                    if (obj.logSqls) {
                        console.log(sqlDelegate.sql);
                    }
                    dbContext.executeSql(sqlDelegate.sql, [], function(tx, result) {
                        if (sqlDelegate.entity) {
                            sqlDelegate.entity.id = result.insertId;
                        }
                    });
                }
            }, function(err) {
                if (obj.alertErrors) {
                    alert(err);
                }
                if (errorCallback == undefined || errorCallback == null) {
                    throw err;
                }
                errorCallback(err);
            }, function() {
                successCallback && successCallback();
            });
        }
    };
})();