/**
 * ==========================================================
 * 
 * This is not an official port of Cairngorm MVC Framework
 * @author Babelium Project -> http://www.babeliumproject.com
 * 
 * ==========================================================
 * 
 * @source Cairngorm (Flex) Open Source Code:
 * http://sourceforge.net/adobe/cairngorm/code/839/tree/cairngorm/trunk/frameworks/cairngorm/com/adobe/cairngorm/
 * @source Simple Javascript Inheritance (./base.js):
 * http://ejohn.org/blog/simple-javascript-inheritance/#postcomment
 * @source Singleton Pattern w and w/o private members:
 * http://stackoverflow.com/questions/1479319/simplest-cleanest-way-to-implement-singleton-in-javascript
 * 
 */

/* ============================================================
 * control/FrontController.as
 * ==========================================================*/

var Cairngorm = {};

Cairngorm.FrontController = Class.extend(
{
	/**
	 * Constructor
	 */
	init : function ()
	{
		this.commands = {};
	},
	
	/**
	 * Add command
	 * @param evType = Event Type (String)
	 * @param commandRef = Class
	 */
	addCommand : function (evType, commandRef)
	{	
		if ( evType == null )
			return;
		
		this.commands[evType] = commandRef;
		Cairngorm.EventDispatcher.addEventListener(evType, this);
	},
	
	/**
	 * Remove Command
	 * @param commandName = String
	 */
	removeCommand : function ( commandName )
	{
		if ( commandName == null )
			return;
		
		this.commands[commandName] = null;
		delete this.commands[commandName];
	},
	
	/**
	 * Execute Command
	 * @param ev = CairngormEvent
	 */
	executeCommand : function ( ev )
	{
		new this.commands[ev.type]().execute();
	}
});


/* ============================================================
 * control/CairngormEventDispatcher.as
 * ==========================================================*/

Cairngorm.EventDispatcher = (function()
{
	// Private interface
	var _listeners = {};
	
	// Public interface
	return {
		
		/**
		 * Add Event Listener
		 * @param type = Event Type (String)
		 * @param listener = function
		 */
		addEventListener : function ( type, listener )
		{
			if ( type != null && typeof listener.executeCommand == 'function' )
				_listeners[type] = listener;
		},
		
		/**
		 * Dispatch event
		 * @param ev = Cairngorm Event
		 */
		dispatchEvent : function ( ev )
		{	
			if ( _listeners[ev.type] != null )
				_listeners[ev.type].executeCommand(ev);
		}
	};
})();

/* ============================================================
 * control/CairngormEvent.as
 * ==========================================================*/

Cairngorm.Event = Class.extend(
{	
	/**
	 * Constructor
	 * @param type = String
	 */
	init : function ( type )
	{
		this.type = type;
		this.data = {};
	},
	
	/**
	 * Dispatch Cairngorm Event 
	 */
	dispatch : function ()
	{
		return Cairngorm.EventDispatcher.dispatchEvent(this);
	},
	
	/**
	 * Set data
	 * @param data = Object
	 */
	setData : function ( data )
	{
		this.data = data;
	},
	
	/**
	 * Get data
	 */
	getData : function ()
	{
		return this.data;
	}
});


/* ============================================================
 * command/Command.as
 * ==========================================================*/

Cairngorm.Command = Class.extend(
{	
	/**
	 * Execute an action
	 */
	execute : function () {}
});


/* ============================================================
 * business/HTTPServices.as
 * ==========================================================*/

Cairngorm.HTTPServices = Class.extend(
{
	/**
	 * Constructor
	 */
	init : function ()
	{
		this.services = {};
	},
		
	/**
	 * Finds a service by name
	 * @param name : service id
	 * @return RemoteObject
	 */
	getService : function ( name )
	{
		return this.services[name];
	},
	
	/**
	 * Register a service identified by its id
	 * @param name : service id
	 * @param service : httpservice
	 */
	registerService : function ( name, service )
	{
		this.services[name] = service;
	}

});


/* ============================================================
 * RemoteObject.as
 * ==========================================================*/

Cairngorm.HTTPService = Class.extend(
{
	/**
	 * Constructor
	 */
	init : function ( gateway, target )
	{
		this.gateway = gateway;
		this.target = target;
	},

	call : function ( params, responder ) 
	{
		if ( params == null )
			params = "";

		var src = this.gateway + this.target + "&" + params;
		
		$.ajax(
		{
			// Target url
			url : src,
			// The success call back.
			success : responder.onResult,
			// The error handler.
			error : responder.onFault
		});
	}

});


/* ============================================================
 * business/ServiceLocator.as
 * ==========================================================*/

Cairngorm.ServiceLocator = (function()
{
	// Private interface
	var _httpServices = new Cairngorm.HTTPServices();
	// TODO var _remoteObjects = null;
	// TODO var _webServices = null;
	
	// Public interface
	return {
		
		/**
		 * Finds remote object by name
		 * @return RemoteObject
		 */
		getHttpService : function ( name )
		{
			return _httpServices.getService(name);
		},
	
		/**
		 * Register a service identified by its id
		 * @param name : service id
		 * @param service : httpservice
		 */
		registerHttpService : function ( name, service )
		{
			_httpServices.registerService(name, service);
		}
	};

})();