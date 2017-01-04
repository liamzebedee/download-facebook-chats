const login = require("facebook-chat-api");
const fs = require('fs');
const sleep = require('sleep');
const sanitize = require("sanitize-filename");


var fbApi;

const deets = {
	email: "",
	password: "",
	yourName: "" // full fb name
}


function downloadChat(thread, timeout = 3) {
	let chatName = "";

	fbApi.getThreadHistory(thread.threadID, 0, thread.messageCount-1, null, (err, history) => {
	    if(err) {
		    sleep.sleep(timeout)
		    return downloadChat(thread, timeout * 2)
		    //return console.error(err);
		}

		// Set chat name of one-on-one chats
		if(thread.participantIDs.length == 2) { 
		    for(var msg of history) {
		    	if(msg.senderName != deets.yourName) {
		    		chatName = msg.senderName;
		    		break;
		    	}
		    }
		} else chatName = thread.name || thread.participantIDs.join(' ');

		chatName = sanitize(chatName);

		var stream = fs.createWriteStream(`${chatName}.txt`);
		stream.once('open', function(fd) {
			for(var msg of history) {
				let name = msg.participantNames[0];

				if(msg.body) stream.write(`[${name}] ${msg.body}\n`)
			}
			stream.end();
		});

	})
}


const batchSize = 5;
const max = 80;
let current = 8;
for(let current = 8; current < 80; current += batchSize) {
	downloadThreads(current, current + 5);
}

function downloadThreads(start, end) {
	login(deets, (err, api) => {
		fbApi = api;

	    if(err) return console.error(err);

	    //const startThread = 3;
	    //const endThread = 8;


	    api.getThreadList(start, end, 'inbox', (err, arr) => {
		    if(err) return console.error(err);

	    	arr.forEach(thread => downloadChat(thread));
	    }) 
	});
}

