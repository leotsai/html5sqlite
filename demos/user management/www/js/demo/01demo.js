(function() {
    window.demo = {
        pages:{},
        db: {
            _instance: null,
            init: function (callback) {
                if (this._instance == null) {
                    var db = new DemoDbContext();
                    try {
                        db.init(function () {
                            demo.db._instance = db;
                            callback && callback();
                        });
                    } catch (ex) {
                        alert(ex);
                    }
                } else {
                    callback();
                }
            },
            getInstance: function () {
                return this._instance;
            }
        }
    };
})();

