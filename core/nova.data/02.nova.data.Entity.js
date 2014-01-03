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
