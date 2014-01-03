(function() {
    if (!window.nova) {
        window.nova = {};
    }
    nova.data = {};
})();
Array.prototype.each = function (func) {
    for (var i = 0; i < this.length; i++) {
        var item = this[i];
        var result = func.call(item, i, item);
        if (result == false) {
            return;
        }
    }
};

Array.prototype.sum = function(propertyOrFunc) {
    var total = 0;
    var isFunc = typeof(propertyOrFunc) == "function";
    this.each(function() {
        if (isFunc) {
            total += propertyOrFunc.call(this);
        } else {
            var value = this[propertyOrFunc];
            if (value != undefined && value != null) {
                total += value * 1;
            }
        }
    });
    return total;
};

Array.prototype.where = function (predicateFunction) {
    var results = new Array();
    this.each(function() {
        if (predicateFunction.call(this)) {
            results.push(this);
        }
    });
    return results;
};

Array.prototype.orderBy = function (property, compare) {
    var items = this;
    for (var i = 0; i < items.length - 1; i++) {
        for (var j = 0; j < items.length - 1 - i; j++) {
            if (isFirstGreaterThanSecond(items[j], items[j + 1])) {
                var temp = items[j + 1];
                items[j + 1] = items[j];
                items[j] = temp;
            }
        }
    }
    function isFirstGreaterThanSecond(first, second) {
        if (compare != undefined) {
            return compare(first, second);
        }
        else if (property == undefined || property == null) {
            return first > second;
        }
        else {
            return first[property] > second[property];
        }
    }

    return items;
};

Array.prototype.orderByDescending = function (property, compare) {
    var items = this;
    for (var i = 0; i < items.length - 1; i++) {
        for (var j = 0; j < items.length - 1 - i; j++) {
            if (!isFirstGreaterThanSecond(items[j], items[j + 1])) {
                var temp = items[j + 1];
                items[j + 1] = items[j];
                items[j] = temp;
            }
        }
    }
    function isFirstGreaterThanSecond(first, second) {
        if (compare != undefined) {
            return compare(first, second);
        }
        else if (property == undefined || property == null) {
            return first > second;
        }
        else {
            return first[property] > second[property];
        }
    }
    return items;
};

Array.prototype.groupBy = function (predicate) {
    var results = [];
    var items = this;

    var keys = {}, index = 0;
    for (var i = 0; i < items.length; i++) {
        var selector;
        if (typeof predicate === "string") {
            selector = items[i][predicate];
        } else {
            selector = predicate(items[i]);
        }
        if (keys[selector] === undefined) {
            keys[selector] = index++;
            results.push({ key: selector, value: [items[i]] });
        } else {
            results[keys[selector]].value.push(items[i]);
        }
    }
    return results;
};

Array.prototype.skip = function (count) {
    var items = new Array();
    for (var i = count; i < this.length; i++) {
        items.push(this[i]);
    }
    return items;
};

Array.prototype.take = function (count) {
    var items = new Array();
    for (var i = 0; i < this.length && i < count; i++) {
        items.push(this[i]);
    }
    return items;
};

Array.prototype.firstOrDefault = function (predicateFunction) {
    if (this.length == 0) {
        return null;
    }
    if (predicateFunction == undefined || predicateFunction == null) {
        return this[0];
    }
    var item = null;
    this.each(function () {
        if (predicateFunction.call(this)) {
            item = this;
            return false;
        }
    });
    return item;
};

Array.prototype.any = function(predicateFunction) {
    if (predicateFunction == undefined || predicateFunction == null) {
        return this.length > 0;
    }
    var hasAny = false;
    this.each(function() {
        if (predicateFunction.call(this)) {
            hasAny = true;
            return false;
        }
    });
    return hasAny;
};

Array.prototype.select = function (predicateFunction) {
    if (predicateFunction == undefined || predicateFunction == null) {
        throw "parameter predicateFunction cannot be null or undefined";
    }
    var items = [];
    this.each(function () {
        items.push(predicateFunction.call(this));
    });
    return items;
};

(function() {
    nova.data.Entity = function() {
        this.id = 0;
    };

    var dataTypes = {
        integer: "integer",
        decimal: "decimal",
        string: "string",
        bool: "boolean",
        object: "object",
        date: "date"
    };

    nova.data.Entity.dataTypes = dataTypes;

    nova.data.Entity.prototype = {
        getFields: function() {
            var fields = [];
            var instance = this;
            for (var property in instance) {
                var type = typeof(instance[property]);
                var field = {
                    name: property
                };
                switch (type) {
                case "number":
                    if (instance[field] % 1 != 0) {
                        field.type = dataTypes.decimal;
                    } else {
                        field.type = dataTypes.integer;
                    }
                    break;
                case "string":
                    field.type = dataTypes.string;
                    break;
                case "boolean":
                    field.type = dataTypes.bool;
                    break;
                case "object":
                    var value = instance[field.name];
                    if (value instanceof Date) {
                        field.type = dataTypes.date;
                    }
                    break;
                default:
                    break;
                }
                if (field.type != undefined) {
                    fields.push(field);
                }
            }
            return fields;
        }
    };


    nova.data.Entity.getDbType = function(type) {
        switch (type) {
            case dataTypes.integer:
            case dataTypes.bool:
            case dataTypes.date:
                return "INTEGER";
            case dataTypes.decimal:
                return "NUMERIC";
            case dataTypes.string:
                return "TEXT";
            default:
                break;
            }
            return "NULL";
    };

    nova.data.Entity.parseFromDbValue = function(type, value) {
        if (value == null) {
            return null;
        }
        switch (type) {
            case dataTypes.integer:
            case dataTypes.decimal:
            case dataTypes.string:
                return value;
            case dataTypes.bool:
                return value == 1 ? true : false;
            case dataTypes.date:
                return new Date(value);
            default:
                break;
            }
        return value.toString();
    };

    nova.data.Entity.getDbValue = function(type, value) {
        if (value == null) {
            return "null";
        }
        switch (type) {
            case dataTypes.integer:
            case dataTypes.decimal:
                return value;
            case dataTypes.string:
                var reg = new RegExp("'", "g");
                return "'" + (value + '').replace(reg, "''") + "'";
            case dataTypes.bool:
                return value ? 1 : 0;
            case dataTypes.date:
                if (typeof(value) == "string") {
                    return eval("new " + value.replace(/\//g, '')).getTime();
                }
                return value.getTime();
        default:
            break;
        }
        return value.toString();
    };
})();

(function() {
    nova.data.Queryable = function(repository, expression) {
        this.repository = repository;
        this._wheresCount = 0;
        this.sql = '';
        if (expression != undefined) {
            this.where(expression);
        }
    };

    nova.data.Queryable.prototype = {
        where: function(expression) {
            if (this.sql == '') {
                this.sql = 'select * from ' + this.repository.table + ' where ' + expression;
            } else {
                this.sql = 'select * from (' + this.sql + ') as t' + this._wheresCount.length + ' where ' + expression;
            }
            this._wheresCount++;
            return this;
        },
        orderBy: function(expression) {
            if (this.sql == '') {
                this.sql = 'select * from ' + this.repository.table + ' order by ' + expression;
            } else {
                this.sql += ' order by ' + expression;
            }
            return this;
        },
        thenBy: function(expression) {
            if (this.sql == '') {
                this.orderBy(expression);
            } else {
                this.sql += ' then by ' + expression;
            }
            return this;
        },
        firstOrDefault: function(callback, expression) {
            if (expression != undefined) {
                this.where(expression);
            }
            var sql = this.sql;
            if (sql == '') {
                sql = 'select * from ' + this.repository.table + ' limit 0,1';
            } else {
                var randomText = Math.abs(Math.round(Math.random() * 10000));
                sql = 'select * from (' + sql + ') as t' + randomText + ' limit 0,1';
            }
            this.query(sql, function(items) {
                if (items.length == 0) {
                    callback(null);
                } else {
                    callback(items[0]);
                }
            });
        },
        toArray: function(callback) {
            var sql = this.sql;
            if (sql == '') {
                sql = 'select * from ' + this.repository.table;
            }
            this.query(sql, callback);
        },
        query: function(sql, callback) {
            var repo = this.repository;
            repo.db.query(sql, function(items) {
                var fields = repo.getFields();
                var entities = [];
                items.each(function() {
                    var item = this;
                    var entity = new repo.type();
                    fields.each(function() {
                        entity[this.name] = nova.data.Entity.parseFromDbValue(this.type, item[this.name]);
                    });
                    entities.push(entity);
                });
                callback(entities);
            });
        }
    };
})();

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

(function() {
    var systemTables = {
        info: "__WebKitDatabaseInfoTable__",
        version: "versions",
        sequence: "sqlite_sequence",
        getAll:function() {
            return [this.info, this.version, this.sequence];
        }
    };

    nova.data.DbContext = function (name, version, displayName, estimatedSize) {
        this.db = null;
        this.logSqls = false;
        this.alertErrors = false;
        this.version = version;
        this.versions = new nova.data.Repository(this, nova.data.DbVersion, "versions");
        if (name != undefined) {
            if (window.openDatabase) {
                this.db = window.openDatabase(name, "1.0", displayName, estimatedSize);
            }
        }
    };

    nova.data.DbContext.prototype = {        
        init : function (callback) {
            var obj = this;
            obj.isTableExisting("versions", function (exists) {
                if (exists) {
                    obj.versions.toArray(function (entities) {
                        if (entities.length == 0) {
                            initVersionAndData(obj, callback);
                        } else {
                            var lastVersion = entities[0];
                            if (lastVersion.version != obj.version) {
                                var migrations = obj.getMigrations();
                                if (migrations == null || migrations.length == 0) {
                                    obj.reCreateTables(function() {
                                        initVersionAndData(obj, callback);
                                    }, null);
                                } else {
                                    doMigrations(obj, lastVersion.version, callback);
                                }
                            }
                            else {
                                if (callback != undefined && callback != null) {
                                    callback();
                                }
                            }
                        }
                    });
                } else {
                    obj.reCreateTables(function () {
                        initVersionAndData(obj, callback);
                    }, null);
                }
            });
        },
        getMigrations: function() {
            return [];
        },
        initData : function (callback) {
            callback && callback();
        },
        clearAllData : function (callback, excludeTables) {
            var obj = this;
            this.db.transaction(function (t) {
                t.executeSql("select name from sqlite_master where type=\"table\"", [],
                    function (t, r) {
                        var tables = [];
                        for (var x = 0; x < r.rows.length; x++) {
                            tables.push(r.rows.item(x).name);
                        }
                        if (!excludeTables) {
                            excludeTables = systemTables.getAll();
                        }

                        var dropSqls = [];
                        for (var di = 0; di < tables.length; di++) {
                            if (!excludeTables.any(function () {
                                return this == tables[di];
                            })) {
                                dropSqls.push("drop table " + tables[di]);
                            };
                        }
                        if (dropSqls.length == 0) {
                            callback && callback();
                            return;
                        }
                        obj.executeSql(dropSqls, function () {
                            callback && callback();
                        }, function () {
                            console.log('drop tables failed.');
                        });
                    },
                    function (t, e) {
                        console.log(e);
                    }
                );
            });
        },
        getTables : function () {
            var tables = [];
            for (property in this) {
                var query = this[property];
                if (query instanceof nova.data.Repository) {
                    tables.push(this[property].table);
                }
            }
            return tables;
        },
        isTableExisting : function (table, callback) {
            var obj = this;
            var sql = "SELECT name FROM sqlite_master WHERE type='table' AND name='" + table + "'";
            this.query(sql, function (items) {
                callback(items.length > 0);
            }, function (err) {
                if (obj.alertErrors) {
                    alert(sql + ":" + err);
                }
                return false;
            });
        },
        dropAllTables : function (callback) {
            var obj = this;
            var existingTablesQuery = "select name from sqlite_master where type='table'";
            obj.query(existingTablesQuery, function (tables) {
                var excluded = [systemTables.info, systemTables.sequence];
                var dropSqls = [];
                tables.each(function () {
                    var table = this;
                    var isExcluded = excluded.any(function () {
                        return this == table.name;
                    });
                    if (!isExcluded) {
                        dropSqls.push("DROP TABLE IF EXISTS " + table.name);
                    }
                });
                obj.executeSql(dropSqls, function () {
                    callback && callback();
                }, function () {
                    console.log('drop tables failed.');
                });
            });
        },
        reCreateTables : function (successCallback, errorCallback) {
            var obj = this;
            obj.dropAllTables(function () {
                var sqls = [];
                obj.getTables().each(function () {
                    var table = this;
                    var columns = [];
                    obj[table].getFields().each(function () {
                        if (this.name == "id") {
                            columns.push("id INTEGER PRIMARY KEY AUTOINCREMENT");
                        } else {
                            columns.push(this.name + " " + nova.data.Entity.getDbType(this.type));
                        }
                    });
                    sqls.push("CREATE TABLE " + table + " (" + columns.join() + ")");
                });
                obj.executeSql(sqls, successCallback, errorCallback);
            });
        },
        executeSql : function (sqls, successCallback, errorCallback) {
            var obj = this;
            if (this.db != null) {
                this.db.transaction(function (dbContext) {
                    if (sqls instanceof Array) {
                        for (var s = 0; s < sqls.length; s++) {
                            var sql = sqls[s];
                            if (obj.logSqls) {
                                console.log(sql);
                            }
                            dbContext.executeSql(sql);
                        }
                    } else {
                        if (obj.logSqls) {
                            console.log(sqls);
                        }
                        dbContext.executeSql(sqls);
                    }
                }, function (err) {
                    if (obj.alertErrors) {
                        alert(err);
                    }
                    if (errorCallback == undefined || errorCallback == null) {
                        throw err;
                    }
                }, function () {
                    if (successCallback != undefined) {
                        successCallback();
                    }
                });
            }
        },
        query : function (sql, successCallback, errorCallback, paras) {
            var obj = this;
            if (obj.db != null) {
                obj.db.transaction(function (dbctx) {
                    if (obj.logSqls) {
                        console.log(sql);
                    }
                    var sqlParas = paras == undefined ? [] : paras;
                    dbctx.executeSql(sql, sqlParas, function (tx, result) {
                        var items = [];
                        for (var i = 0; i < result.rows.length; i++) {
                            items.push(result.rows.item(i));
                        }
                        successCallback(items);
                    }, function (err) {
                        if (obj.alertErrors) {
                            alert(err);
                        }
                        if (errorCallback == undefined || errorCallback == null) {
                            throw err;
                        }
                        else {
                            errorCallback(err);
                        }
                    });
                }, function (err) {
                    if (obj.alertErrors) {
                        alert(err);
                    }
                    if (errorCallback == undefined || errorCallback == null) {
                        throw err;
                    }
                    else {
                        errorCallback(err);
                    }
                });
            }
        }
    };


    var initVersionAndData = function (obj, callback) {
        var version = new nova.data.DbVersion();
        version.version = obj.version;

        obj.versions.add(version);
        obj.saveChanges(function () {
            obj.initData(callback);
        }, null);
    };

    var doMigrations = function (obj, lastVersion, callback) {
        var index = 0;
        var migrations = obj.getMigrations();
        var version = obj.version;
        function exec() {
            if (migrations.length <= index) {
                updateVersion();
            } else {
                var migration = migrations[index];
                if (migration.version > lastVersion && migration.version <= version) {
                    migration.migrate(function () {
                        index++;
                        exec();
                    });
                } else {
                    index++;
                    exec();
                }
            }
        }
        
        function updateVersion() {
            var sql = "update versions set version = " + version;
            obj.executeSql(sql, callback, function(err) {
                console.log("run migration sqls error: " + err);
                if (obj.alertErrors) {
                    alert("run migration sqls error: " + err);
                }
            });
        }

        exec();
    };
})();


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
(function() {
    nova.data.DbVersion = function() {
        nova.data.Entity.call(this);
        this.version = 0;
    };
    nova.data.DbVersion.prototype = new nova.data.Entity();
    nova.data.DbVersion.constructor = nova.data.DbVersion;
})();