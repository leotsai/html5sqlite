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

