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
