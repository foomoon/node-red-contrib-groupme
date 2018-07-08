
module.exports = function(RED) {
    "use strict";
    //var reconnect = RED.settings.sqliteReconnectTime || 20000;

    function GroupMeConfig(n) {
        RED.nodes.createNode(this,n);

        this.token = n.token;
        this.bot = n.bot;
        this.name = n.name;
        var node = this;

        node.doConnect = function() {
            /*node.db = new sqlite3.Database(node.dbname);
            node.db.on('open', function() {
                if (node.tick) { clearTimeout(node.tick); }
                node.log("opened "+node.dbname+" ok");
            });
            node.db.on('error', function(err) {
                node.error("failed to open "+node.dbname, err);
                node.tick = setTimeout(function() { node.doConnect(); }, reconnect);
            });*/
        }

        node.on('close', function () {
            //if (node.tick) { clearTimeout(node.tick); }
            //if (node.db) { node.db.close(); }
        });
    }
    RED.nodes.registerType("groupme-config",GroupMeConfig);


    function GroupMeOut(n) {
        RED.nodes.createNode(this,n);
        this.config = n.config;
        this.myConfig = RED.nodes.getNode(this.config);
        this.GroupmeAPI = require('groupme').Stateless;
        
        
        // --- DEBUG -------------------------------------------------------------------
        /*this.GroupmeAPI.Users.me(this.myConfig.token, function(err,ret) {
  			if (!err) {
    			node.warn("Your user id is " + ret.id, "and your name is " + ret.name);        
  			}
		});*/
		// -----------------------------------------------------------------------------

        if (this.myConfig) {
            //this.myConfig.doConnect();
            var node = this;
            node.status({fill:"green",shape:"ring",text:"OK"});
            
            node.on("input", function(msg) {
            	msg.payload = {token: this.myConfig.token, bot: this.myConfig.bot};
            	
            	var myMessage = msg.topic || "nothing";
            	var myToken = msg.token || this.myConfig.token;
            	var myBot = msg.bot || this.myConfig.bot;
            	var myOpts = msg.Picture ? {picture_url: msg.Picture} : {};
            	
            	this.GroupmeAPI.Bots.post(myToken, myBot, myMessage, myOpts, function(err,ret) {
  						if (!err) {
    						// Do Nothing
    						//node.send(msg);
    						node.status({fill:"green",shape:"dot",text:"Sent"});
  						} else {
    						//node.send({payload:err});
    						node.status({fill:"red",shape:"ring",text:"Error"});
    						node.error("ERROR!", err);
  						} 
					});
            	
            	
                /*(if (typeof msg.topic === 'string') {
                    //console.log("query:",msg.topic);
                    var bind = Array.isArray(msg.payload) ? msg.payload : [];
                    node.mydbConfig.db.all(msg.topic, bind, function(err, row) {
                        if (err) { node.error(err,msg); }
                        else {
                            msg.payload = row;
                            node.send(msg);
                        }
                    });
                }
                else {
                    if (typeof msg.topic !== 'string') {
                        node.error("msg.topic : the query is not defined as a string",msg);
                    }
                }*/
            });
        }
        else {
            this.error("Groupme not configured");
        }
    }
    RED.nodes.registerType("groupme out",GroupMeOut);
    
    
    
    function GroupMeIn(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.config = n.config;
        this.user = n.user;
        this.group = n.group;
        
        this.myConfig = RED.nodes.getNode(this.config);
        
        var IncomingStream = require('groupme').IncomingStream;
        
        if (this.group) {
        	//node.warn(this.group);
        	var iStream = new IncomingStream(this.myConfig.token, this.user, [this.group]);
        } else {
        	var iStream = new IncomingStream(this.myConfig.token, this.user); 
        }
		
		
		/*Register for events using iStream.on(EVENT, CALLBACK);

		connected When the connection succeeds and is listening for messages.
		pending When a connection is in progress
		disconnected When a connection is dropped.
		message Received a message from GroupMe, passing (data), JSON from server
		error when a failure occurs, passing (message, payload)
		status For logging purposes, passing (message, payload)*/
		
		iStream.on('connected', function () {
			node.status({fill:"green",shape:"ring",text:"Connected"});
		});
		
		iStream.on('message', function (data) {
			if (data.data) {
				if (data.data.type == "ping") {
					node.status({fill:"blue",shape:"ring",text:"Ping"});
				}
				if (data.data.type == "line.create") {
					
					//node.warn("listening to group: " + node.group);
					//node.warn("speaking group: " + data.data.subject.group_id); 
					
					if (data.data.subject.group_id == node.group || node.group == "") {
						node.send({payload: data.data});
						node.status({fill:"green",shape:"ring",text:"Message Received"});
					}
				}
			}
		});
		
		iStream.connect();
		
        node.on('close', function () {
            // On close, cleanup
            iStream.disconnect();
        });
    }
    RED.nodes.registerType("groupme in",GroupMeIn);
    
}
