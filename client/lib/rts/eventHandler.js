/* eslint no-console: "off" */
define(["primus"], function(Primus) {
    return {
        createPrimus: function(url) {
            return new Primus(url);
        },
        setupPrimus: function(vm, clientType) {
            vm.primus = this.createPrimus(location.href.replace(location.hash, "") + "?clientType=" + clientType);

            vm.primus.on("open", function() {
                console.log("Connection established.");
                this.isConnected = true;
            }.bind(vm));
            vm.primus.on("reconnect timeout", function(err, opts) {
                console.log("Timeout expired: %s", err.message);
            });
            vm.primus.on("reconnect", function(err, opts) {
                console.log("Reconnecting.", err.message);
                this.isConnected = false;
            }.bind(vm));
            vm.primus.on("reconnected", function(err, opts) {
                console.log("Reconnected.", err.message);
                this.isConnected = true;
            }.bind(vm));
            vm.primus.on("end", function() {
                console.log("Connection ended.");
                this.isConnected = false;
            }.bind(vm));
            vm.primus.on("data", function(data) {
                console.log(data);
                if (this.messages !== undefined) {
                    this.messages.push({message: "Message received: " + data.messageType});
                }
                if (data.messageType) {
                    switch (data.messageType) {
                    case "initialize":
                        if (this.initializeMessage !== undefined) {
                            this.initializeMessage(data.message);
                        }
                        break;
                    case "device":
                        if (this.deviceMessage !== undefined) {
                            this.deviceMessage(data.message);
                        }
                        break;
                    case "meeting":
                        if (this.meetingMessage !== undefined) {
                            this.meetingMessage(data.message);
                        }
                        break;
                    case "request":
                        if (this.requestMessage !== undefined) {
                            this.requestMessage(data.message);
                        }
                        break;
                    case "refresh":
                        if (this.refreshMessage !== undefined) {
                            this.refreshMessage(data.message);
                        }
                        break;
                    }
                } else {
                    console.log(JSON.stringify(data));
                }
            }.bind(vm));
        }
    };
});
