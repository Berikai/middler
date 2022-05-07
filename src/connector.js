const net = require('net');
const log = require('./libs/log');

let clients = [];
const tunnel = new net.Socket();

const config = {
	ip: {
		tunnel: '192.168.1.19',
		host: 'localhost'
	},
	port: {
		tunnel: 51781,
		host: 54323
	},
};

// VirtualClient Object
const VirtualClient = function (id) {
	this.id = id; // as hex form
	this.socket = new net.Socket(); // create socket
	this.write = data => this.socket.write(data);
	this.socket.connect(config.port.host, config.ip.host, () => log('Connected to host.', `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`));
	this.socket.on('data', data => tunnel.write(Buffer.from(this.id + data.toString('hex'), 'hex')));
	this.socket.on('error', err => log(err, `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`));
	this.socket.on('close', () => {
		clients = clients.filter(client => client.id != this.id);
		log('Connection lost.', `VirtualClient${Buffer.from(this.id, 'hex').toString('ascii')}`)
		tunnel.write(`${Buffer.from(this.id, 'hex')}CLIENT_LOST`);
	});
}

// Tunnel Connector
tunnel.connect(config.port.tunnel, config.ip.tunnel, () => log('Connected to tunnel.', 'Node'));
tunnel.on('error', (err) => log(err, 'Connector'));
tunnel.on('close', () => log('Connection lost.', 'Connector'));
tunnel.on('data', (data) => {
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
});