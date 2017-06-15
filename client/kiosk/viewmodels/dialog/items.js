/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog"], function(http, dialog) {
    var ctor = function() {
        this.activate = function(items) {
            this.items = items;
        },
        this.items = [];
        this.subTopics = [];
        this.showSubTopics = false;
        this.selectedItem = null;
        this.selectItem = function(item) {
            if(item.subTopics) {
                this.selectedItem = item;
                this.subTopics = item.subTopics;
                this.showSubTopics = true;
            } else {
                dialog.close(this, {
                    item: item
                });
            }
        };
        this.selectSubTopic = function(subTopic) {
            dialog.close(this, {
                item: this.selectedItem,
                subTopic: subTopic
            });
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
