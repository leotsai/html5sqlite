(function() {
    demo.pages.Index = function() {

    };

    demo.pages.Index.prototype = {
        onLoaded: function() {
            var obj = this;
            $("#btnAdd").click(function() {
                obj.add();
            });
            $("#btnUpdate").click(function() {
                obj.update();
            });
            $("#btnCancel").click(function() {
                obj.reset();
            });
            $(".btn-delete").live("click", function() {
                obj.deleteUser(this);
            });
            $(".btn-edit").live("click", function() {
                obj.edit(this);
            });

            var thisYear = new Date().getFullYear();
            var yearsHtml = "";
            for (var i = thisYear; i > thisYear - 100; i--) {
                yearsHtml += '<option value="' + i + '">' + i + '</option>';
            }
            $("#ddlYears").html(yearsHtml);
            this.loadUsers();
        },
        loadUsers: function() {
            var obj = this;
            var service = new UserService();
            service.getAll(function(users) {
                var html = "";
                for (var i = 0; i < users.length; i++) {
                    html += obj.createRowHtml(users[i]);
                }
                $("#users").html(html);
            });
        },
        parseUser: function() {
            var user = new User();
            user.id = $("#hfId").val() * 1;
            user.username = $("#txtUsername").val();
            user.birthYear = $("#ddlYears").val() * 1;
            user.isDisabled = $("#ddlDisabled").val() == "true";
            return user;
        },
        bindForm: function (user) {
            $("#hfId").val(user.id);
            $("#txtUsername").val(user.username);
            $("#ddlYears").val(user.birthYear);
            $("#ddlDisabled").val(user.isDisabled);
        },
        createRowHtml: function(user) {
            var html = '<tr data-id=' + user.id + '>\
                            <td>' + user.username + '</td>\
                            <td>' + user.birthYear + '</td>\
                            <td>' + (user.isDisabled ? 'yes' : 'no') + '</td>\
                            <td>' + user.createdTime.display() + '</td>\
                            <td>' + (user.lastUpdatedTime ? user.lastUpdatedTime.display() : '-') + '</td>\
                            <td>\
                                <input type="button" value="edit" class="btn-edit"/>\
                                <input type="button" value="delete" class="btn-delete"/>\
                            </td>\
                        </tr>';
            return html;
        },
        add: function() {
            var obj = this;
            var user = this.parseUser();
            var service = new UserService();
            service.add(user, function() {
                $("#users").append(obj.createRowHtml(user));
                obj.reset();
            });
        },
        update: function() {
            var obj = this;
            var service = new UserService();
            var user = this.parseUser();
            service.update(user, function() {
                var $tr = $('tr[data-id="' + user.id + '"]');
                $tr.replaceWith(obj.createRowHtml(user));
                obj.reset();
                $("#formEdit")[0].reset();
            });
        },
        reset: function() {
            $("#txtUsername").val("");
            $("#btnAdd").show();
            $("#btnUpdate, #btnCancel").hide();
        },
        edit: function(sender) {
            var id = $(sender).closest("tr").attr("data-id");
            var obj = this;
            var service = new UserService();
            service.get(id, function(user) {
                obj.bindForm(user);
                $("#btnAdd").hide();
                $("#btnUpdate, #btnCancel").show();
            });
        },
        deleteUser: function(sender) {
            if (!confirm("Are you sure you want to delete this user?")) {
                return;
            }
            var id = $(sender).closest("tr").attr("data-id");
            var service = new UserService();
            service.deleteUser(id, function() {
                $(sender).closest("tr").remove();
            });
        }
    };
})();