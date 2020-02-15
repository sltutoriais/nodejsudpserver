/*
*@autor: Sebastiao Lucio Reis de Souza
*@description:  java script file that works as master udp server of the UDP Multiplayer Online Game
*               for more information visit: https://nodejs.org/api/dgram.html
*@update data: 13/02/2020
*/
var express  = require('express');//import express NodeJS framework module
var app      = express();// create an object of the express module
var shortId 		= require('shortid');//import shortid lib
var dgram = require('dgram');//The dgram module provides an implementation of UDP Datagram sockets.
var socket = dgram.createSocket('udp4');//the dgram.Socket to listen for datagram messages on a named port


var clients	= [];//storage clients
var clientLookup = {};// cliends search engine

var maxTimeOut = 20;

socket.on('message', function(message,rinfo) {

 //console.log('server got message: '+message+' from address# '+rinfo.address);

    
	//var data = JSON.parse(message);//parse message to json format
	var data = message.toString().split(':');//parse message to json format
	
	switch(data[0] )
	{
	  
      case "PING":
	  
	     console.log('[INFO] test ping received !!! ');
	     console.log('server got message: '+message+' from address# '+rinfo.address+' port# '+rinfo.port );  
	     
		 //format the data with the sifter comma for they be send from turn to udp client
		 var response = "PONG"+':'+"pong!!!";
		
		//buffering response in byte array
		 var msg = new Buffer.from(response);
		 
		 console.log('send response to client');
		 
		 //Sending Messages back to udp client
	     socket.send(msg,
                0,
                msg.length,
                rinfo.port,//udp client port
                rinfo.address//udp client IP
				    );
				
	     console.log('message send');
	  break;
	  
	  case "JOIN":
	    console.log('[INFO] JOIN received !!! ');
	  	 // fills out with the information emitted by the player in the unity
		currentUser = {
			       name:data[1],
                   position:data[2],
				   rotation:'',
			       id:shortId.generate(),
				   avatar:data[3],
				   animation:"",
				   health:100,
			       maxHealth:100,
			       kills:0,
				   timeOut:0,
				   isDead:false,
				   port:rinfo.port,
			       address:rinfo.address 
				   };//new user  in clients list
					
		console.log('[INFO] data[2] '+data[2]);
		console.log('[INFO] player '+currentUser.name+': logged!');
		console.log('[INFO] currentUser.position '+currentUser.position);
		
	     //add currentUser in clients list
		 clients.push(currentUser);
		 
		 //add client in search engine
		 clientLookup[currentUser.id] = currentUser;
		 
		 console.log('[INFO] Total players: ' + clients.length);
		
		/*********************************************************************************************/		
		 var response = "JOIN_SUCCESS"+':'+currentUser.id+':'+currentUser.name+':'+currentUser.position;
		
		 console.log('send LOGIN_SUCCESS to port :'+  rinfo.port+' and address: '+ rinfo.address);
		 var msg = new Buffer.from(response);
	
		  socket.send(msg,
                 0,
                 msg.length,
                 rinfo.port,
                 rinfo.address);
	
		/*******************************************************************************************************************/		
	    
		/*******************************************************************************************************************/		
		var pack1 = "SPAWN_PLAYER"+':'+currentUser.id+':'+currentUser.name+':'+currentUser.position+':'+currentUser.avatar;
		 
		 var msg_currentUser = new Buffer.from(pack1);
		 
	     
		 // spawn currentUser udp client on clients in broadcast
         clients.forEach( function(i) {
		    if(i.id!=currentUser.id)
			{
		     // console.log('i.address: '+i.name);
	         // console.log('i.address: '+i.address);
		      socket.send(msg_currentUser,
                   0,
                   msg_currentUser.length,
                   i.port,
                   i.address);
		    }
	   
	     });//end_forEach

	  // spawn all clients in currentUser udp client
         clients.forEach( function(i) {
		  
		  if(i.id != currentUser.id)
		  {
		    var pack2 = "SPAWN_PLAYER"+':'+i.id+':'+i.name+':'+i.position+':'+i.avatar;
		    var msg_client = new Buffer.from(response)(pack2);
		    console.log('i.name: '+i.name);
		    console.log('i.port: '+i.port);
	        console.log('i.address: '+i.address);
		 
		      socket.send(msg_client,
                0,
                msg_client.length,
                currentUser.port,
                currentUser.address);
	        }//END_IF
	     });//end_forEach
		 
	  break;
	  
	   case "RESPAWN":
	   if(clientLookup[data[1]])
	   {
	     clientLookup[data[1]].isDead = false;
		 clientLookup[data[1]].health = clientLookup[data[1]].maxHealth;
		  
		 var response = "RESPAW_PLAYER"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].name+':'+clientLookup[data[1]].position
		 +':'+clientLookup[data[1]].rotation;
	
		 var msg = new Buffer.from(response);
	
		  socket.send(msg,
                 0,
                 msg.length,
                 rinfo.port,
                 rinfo.address);
			 
	     
		var pack2 = "SPAWN_PLAYER"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].name+':'+
		clientLookup[data[1]].position+':'+clientLookup[data[1]].rotation;
		 
		 var msg_currentUser = new Buffer.from(pack2);
			  // send current user position in broadcast to all clients in game
         clients.forEach( function(i) {
		      
			if(i.id != clientLookup[data[1]].id)
		    {
		         socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
			}
	   });//END_forEach
		 
	   }
	   break;
	  
	   case "POS_AND_ROT":
	   
	    //console.log('[INFO] MOVE_AND_ROTATE received !!! ');
		
		if(clientLookup[data[1]])
	   {
	     clientLookup[data[1]].timeOut = 0;
	     clientLookup[data[1]].position = data[2];
	  
	     clientLookup[data[1]].rotation = data[3];
		 
		 var pack = "UPDATE_POS_AND_ROT"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].position+':'+clientLookup[data[1]].rotation;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
		 // send current user position in broadcast to all clients in game
         clients.forEach( function(i) {
		      
			if(i.id != clientLookup[data[1]].id)
		    {
		         socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
			}
	   });//END_forEach
	}
		 
	  break;
	  
	  case "ATTACK":
	   
	   if(clientLookup[data[1]])
	   {
	      clientLookup[data[1]].timeOut = 0;
		  
	      var pack = "UPDATE_ATTACK"+':'+clientLookup[data[1]].id;
		 
		  var msg_currentUser = new Buffer.from(pack);
		
		 // send current user position in broadcast to all clients in game
         clients.forEach( function(i) {
		      
			if(i.id != clientLookup[data[1]].id)
		    {
		         socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
			}
	   });//END_forEach
	   }
		
		 
	  break;
	  
	  case "PHYSICAL_DAMAGE":

	  var pack = "";
		 
	  if(clientLookup[data[1]])
	  {
		 clientLookup[data[1]].timeOut = 0;
	  }
	   if(clientLookup[data[2]])
	   {
	         
	         var target = clientLookup[data[2]];
	         var _damage= 10;
	       // se o target não perdeu todo seu health
		     if(target.health - _damage > 0)
			 {
			   //console.log("player: "+target.name+"received damage from: "+clientLookup[data[1]].name);
			   //console.log(target.name+"health: "+ target.health);
			   target.health -=_damage;//health decrement
			 }
			 //target death
			 else
			 {
			    //if not dead
                if(!target.isDead)
               {				
			   
			     target.isDead = true;// target now is dead
				 target.kills = 0;
                 
				 pack = "DEATH"+':'+clientLookup[data[2]].id;
		 
				
				 var msg_currentUser = new Buffer.from(pack);
		
		         // send current user position in broadcast to all clients in game
                 clients.forEach( function(i) {
		   
		                 socket.send(msg_currentUser,
                         0,
                         msg_currentUser.length,
                         i.port,
                         i.address);
			      });//END_forEach
				 
		
			   }//END_ if    
			 }//END_ELSE
		  
		

		  var pack = "UPDATE_PHYSICAL_DAMAGE"+':'+clientLookup[data[1]].id+':'+clientLookup[data[2]].id+
		   ','+clientLookup[data[2]].health;
		  //console.log("pack: "+pack);
		  var msg_currentUser = new Buffer.from(pack);
		
		 // send current user position in broadcast to all clients in game
         clients.forEach( function(i) {
		      
			if(i.id != clientLookup[data[1]].id)
		    {
		         socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
			}
	   });//END_forEach

	   }//END_IF
	   
	  break;  
	  
	  
	  case "ANIMATION":
	   
	     //console.log('user: '+clientLookup[data.local_player_id].name+' new : '+data.animation+' animation');
	     clientLookup[data[1]].animation = data[2];
	  
		 var pack = "UPDATE_PLAYER_ANIMATOR"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].animation;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
		 // send current user animation in broadcast to all clients in game
         clients.forEach( function(i) {
		  
		    if(i.id != clientLookup[data[1]].id)
		    {
		      socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
		    }
	   });//END_forEach
	   
	   
	  break;
	  
	  case "disconnect":
	    if(clientLookup[data[1]].name)
		{
	     console.log('user: '+clientLookup[data[1]].name+' tring desconnect');
	   
		 var pack = "USER_DISCONNECTED"+':'+clientLookup[data[1]].id;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
         clients.forEach( function(i) {
		       
			if(i.id != clientLookup[data[1]].id)
		    {
		      socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
		    }
	   });//END_forEach
	   
	   for (var i = 0; i < clients.length; i++)
		  {
			if (clients[i].name == clientLookup[data[1]].name 
			          && clients[i].id == clientLookup[data[1]].id) 
			{

				console.log("User "+clients[i].name+" has disconnected");
				
				//remove the current client from the list
				clients.splice(i,1);

			};//END_IF
		  };//END_FOR
		  }
       break; 
	   
	}//END-SWITCH	
	
});//END_SOCKET.ON

//setup udp server port
var port = 3000;
var HOST = '127.0.0.1';
/* server listening 127.0.0.1:process.env.PORT or 127.0.0.1:port
 * socket.bind(PORT, HOST);
*/
socket.bind(process.env.PORT||port,HOST);

socket.on('listening',function(){

var address = socket.address();

console.log('UDP Server listening on '+ address.address+':'+address.port);

});//END_SOCKET.ON


function DisconnectClientByTimeOut(id){


 var pack = "USER_DISCONNECTED"+','+clientLookup[id].id;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
         clients.forEach( function(i) {
		       
		   if(i)
		   {
			if(i.id != clientLookup[id].id)
		    {
		      socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
		    }
			}
	   });//END_forEach
	   
	   for (var i = 0; i < clients.length; i++)
		  {
		    if(clients[i])
			{
			if (clients[i].name == clientLookup[id].name 
			          && clients[i].id == clientLookup[id].id) 
			{

				console.log("User "+clients[i].name+" has disconnected");
				
				//remove the current client from the list
				clients.splice(i,1);

			};//END_IF
			}
		  };//END_FOR
}
//function to update the players' timeOut
function UpdateTimeOut() {

   /*
  console.log("update time out");

       //foreach client updates timeOut
         clients.forEach( function(i) {
		    
			if(clientLookup[i.id])
			{
			clientLookup[i.id].timeOut +=1;
			
			if(i.timeOut > maxTimeOut)
			{
			 DisconnectClientByTimeOut(i.id);
			}
			}
		  });//end_forEach


		  */
}//END_SEND_UPDATES
setInterval(UpdateTimeOut, 10000);//updates of 30 in 30 seconds


console.log("------- server is running -------");