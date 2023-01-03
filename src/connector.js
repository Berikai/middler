// MADE BY BERIKAI 2023
// https://github.com/berikai

// Middler Connector is responsible for creating virtual clients that represents real clients on host's machine.

const net = require('net');
const log = require('./libs/log');

// Store connected clients
let clients = [];
// Create new Socket to connect Tunnel
const tunnel = new net.Socket();

// Middler Connector Config
const config = {
	ip: {
		tunnel: '192.168.1.8',
		host: 'localhost'
	},
	port: {
		tunnel: 51781,
		host: 54323
	},
};

// VirtualClient represents the clients that are connected to the Virtual Hosts on Middler Tunnel by simulating them on host's machine.
const VirtualClient = (id) => {
	// CLIENT ID IN HEX FORM!
	this.id = id;

	// Create a new Socket to simulate real clients on host's machine.
	this.socket = new net.Socket();

	// Send data to host's server as client
	this.write = data => this.socket.write(data);

	// Connect to host's server
	this.socket.connect(config.port.host, config.ip.host, () => log('Connected to host.', `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`));

	// Send data to Middler Tunnel from host's server.
	this.socket.on('data', data => tunnel.write(Buffer.from(this.id + data.toString('hex'), 'hex')));

	// Log if error occurs
	this.socket.on('error', err => log(err, `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`));

	// If connection to host's server is closed, let the VirtualHost on Tunnel know
	this.socket.on('close', () => {
		// Remove the client from client array
		clients = clients.filter(client => client.id != this.id);
		log('Connection lost.', `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`)
		tunnel.write(`${Buffer.from(this.id, 'hex')}CLIENT_LOST`);
	});
}

// Connect to the tunnel as Middler Connector
tunnel.connect(config.port.tunnel, config.ip.tunnel, () => log('Connected to tunnel.', 'Node'));

// Log if error occurs
tunnel.on('error', (err) => log(err, 'Connector'));

// Log if connection ends with Tunnel
tunnel.on('close', () => log('Connection lost.', 'Connector'));

// Process the data coming from Tunnel
tunnel.on('data', (data) => {
	// If Middler data prefixes exist
	switch (true) {
		// VirtualHost created
		case (Buffer.from(data.toString('hex').substring(0, 18), 'hex') == 'HOST_PORT'):
			log(`Virtual host created: ${Buffer.from(data.toString('hex').substring(18, data.toString('hex').length), 'hex')}`, 'Connector');
			break;

		// New client connected to VirtualHost
		case (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'NEW_CLIENT'):
			// If client is not created before
			if (clients.filter(client => client.id == data.toString('hex').substring(0, 24)) < 1) {
				// Push new VirtualClient to client storage array
				clients.push(new VirtualClient(data.toString('hex').substring(0, 24)));
				log(`New virtual client created: ${Buffer.from(clients[clients.length - 1].id, 'hex').toString('ascii')}`, 'Connector');
			} 
			// Else, probably client already exists
			else log(`ERROR: Could not create new client. Client already exists with id: ${Buffer.from(clients[clients.length - 1].id, 'hex').toString('ascii')}`, 'Connector');
			break;

		// Client connection lost on VirtualHost
		case (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'CLIENT_LOST'):
			// Destroy the client
			clients.map(client => {
				if (client.id == data.toString('hex').substring(0, 24)) {
					client.socket.destroy();
				}
			});
	
			// Remove the client from client storage array
			clients = clients.filter(client => client.id != data.toString('hex').substring(0, 24));
			break;

		// If there is no Middler data prefixes
		default:
			clients.map(client => {
				if (client.id == data.toString('hex').substring(0, 24)) {
					// Send data to client from Tunnel
					client.write(Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex'));
				} else {
					log('Could not find client.', 'Connector');
				}
			});

			break;

	}

	/* Old ugly if else block
	if (Buffer.from(data.toString('hex').substring(0, 18), 'hex') == 'HOST_PORT') {
		log(`Virtual host created: ${Buffer.from(data.toString('hex').substring(18, data.toString('hex').length), 'hex')}`, 'Connector');
	} else if (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'NEW_CLIENT') {
		if (clients.filter(client => client.id == data.toString('hex').substring(0, 24)) < 1) {
			clients.push(new VirtualClient(data.toString('hex').substring(0, 24)));
			log(`New virtual client created: ${Buffer.from(clients[clients.length - 1].id, 'hex').toString('ascii')}`, 'Connector');
		} else {
			log(`ERROR: Could not create new client. Client already exist with id: ${Buffer.from(clients[clients.length - 1].id, 'hex').toString('ascii')}`, 'Connector');
		}
	} else if (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'CLIENT_LOST') {
		clients.map(client => {
			if (client.id == data.toString('hex').substring(0, 24)) {
				client.socket.destroy();
			}
		});
		clients = clients.filter(client => client.id != data.toString('hex').substring(0, 24));
	} else {
		clients.map(client => {
			if (client.id == data.toString('hex').substring(0, 24)) {
				client.write(Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex'));
			} else {
				log('Could not find client.', 'Connector');
			}
		});
	}
	*/
});