// MADE BY BERIKAI 2023
// https://github.com/berikai

// Middler Tunnel is the main server of Middler. It's responsible for creating virtual hosts that represents real hosts. 
// Tunnel creates a virtual host once a real host connects to the Tunnel with Middler Connector.

const net = require('net');
const log = require('./libs/log');
const ascii_to_hex = require('./libs/ascii_to_hex');

// Tunnel Config
let config = {
    ip: {
        tunnel: 'localhost',
        virtual_host: 'tcp.middler.io'
    },
    port: {
        tunnel: 51781
    },
};

// Main function
(function main() {
    let isStart = false;
    for (let i = 0; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case "start":
                isStart = true;
                break;
            case "-p":
                config.port.tunnel = process.argv[i+1];
                break;
            case "-h":
                config.ip.tunnel = process.argv[i+1];
                break;
            case "-d":
                config.ip.virtual_host = process.argv[i+1];
                break;
        }
    }

    if (!isStart) {
        console.log(
`Middler Tunnel is the main server of Middler.

Usage: 
    node src/tunnel [command] [arguments]

Commands:
    start   Start Middler Tunnel.
    help    Displays this page.

Arguments:
    -p      Specify the port for Middler Tunnel to listen.  (default: 51781)
    -h      Specify the host ip for Middler Tunnel to listen.  (default: localhost)
    -d      Specify the domain name for Middle Tunnel to be used as VirtualHost hostnames. (default: tcp.middler.io)
`
    );
        process.exit();
    }
})();

// HostManager manages the hosts that are connected to the Middler Tunnel with Middler Connector
const HostManager = new function() {
    // Store connected hosts
    this.hosts = [];

    // Provide port for new host
    // THIS FUNCTION IS NOT USING A WELL APPROACH. MAKE IT BETTER!
    this.providePort = () => {
        let port = Math.floor(Math.random() * 10000) + config.port.tunnel + 1;

        let samePorts = this.hosts.filter((host) => {
            return host.port == port;
        }).length;

        if (samePorts < 1) return port;
        else this.providePort();
    };

    // Push new host to hosts array
    this.pushHost = (host) => {
        this.hosts.push(host);
    };

    // Remove the host from hosts array which is specified with its port number
    this.removeHost = (port) => {
        this.hosts.map((host, i) => {
            if (host.port == port) this.hosts.splice(i, 1);
        });
    };

};

// VirtualHost represents the hosts that are connected to Middler Tunnel with Middler Connector
const VirtualHost = function() {
    // Store callback functions
    this.callbacks = {
        data: [],
        write: [],
        client_close: [],
    };

    // Get an available port from HostManager
    this.port = HostManager.providePort();

    // Send data to client from Middler Connector
    this.write = (data) => {
        // If VirtualClient that is connected to real hosts on Middler Connector closed, close the real client that is connected to Virtual Host on Middler Tunnel
        if (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'CLIENT_LOST') {
            this.callbacks['client_close'].map(listener => listener(data));
        } 
        // Else, send data to client
        else this.callbacks['write'].map(listener => listener(data));
    };

    // Close VirtualHost
    this.close = () => this.host.close();

    // Create VirtualHost's TCP server for clients to connect
    this.host = new net.Server();

    // Connection handler for TCP server
    this.host.on('connection', Client => {
        // Create an id which has length of 12
        const id = Math.floor(Math.random() * 900000000000) + 100000000000;
        log(`New client created: Client${id}`, `VirtualHost:${this.port}`);

        // Tell Middler Connector that new client connected
        this.callbacks['data'].map(listener => listener(`${id}NEW_CLIENT`));

        // Forward data sent by client to Middler Connector
        Client.on('data', data => this.callbacks['data'].map(listener => listener(Buffer.from(ascii_to_hex(id.toString()) + data.toString('hex'), 'hex')))); 
        
        // Log if error occurs
        Client.on('error', (err) => log(err, `Client${id}_Host:${this.port}`));

        // If client is closed, let Middler Connector know
        Client.on('close', () => {
            this.callbacks['data'].map(listener => listener(`${id}CLIENT_LOST`));
            log('Client closed.', `Client${id}_Host:${this.port}`)
        });

        // Destroy client if closed
        this.on('client_close', (data) => Buffer.from(data.toString('hex').substring(0, 24), 'hex') == id ? Client.destroy() : {});

        // Send data to client
        this.on('write', (data) => Buffer.from(data.toString('hex').substring(0, 24), 'hex') == id ? Client.write(Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex')) : {}); //<<<<<<<<<<<
    });

    // Handle if error occurs on TCP connection
    this.host.on('error', (err) => log(err, `VirtualHost:${this.port}`));

    // Close VirtualHost's TCP server
    this.host.on('close', () => {
        log('Host closed.', `VirtualHost:${this.port}`);
        HostManager.removeHost(this.port);
    });

    // Listen callback functions and add them to callback function storage
    this.on = (event, listener) => {
        if (event == 'data')
            this.callbacks['data'].push(listener);
        if (event == 'write')
            this.callbacks['write'].push(listener);
        if (event == 'client_close')
            this.callbacks['client_close'].push(listener);
    };

    // Start VirtualHost listening on port
    this.host.listen(this.port, config.ip.tunnel, (err) => {
        if (err) log(`Error: New virtual host CANNOT be created on ${this.port}.`, 'Tunnel');
        log(`New virtual host is running on ${this.port}.`, 'Tunnel');
        this.callbacks['data'].map(listener => listener(`HOST_PORT${config.ip.virtual_host}:${this.port}`));
        HostManager.pushHost({
            port: this.port
        });
    });
};

// Create tunnel server
const tunnel = net.createServer(BridgeHost => {
    // Create a new VirtualHost when a Middler Connector connects to Middler Tunnel
    const host = new VirtualHost();

    // Listen data from client and forward it to Middler Connector
    host.on('data', (data) => {
        BridgeHost.write(data);
        //log(data, 'FromClientToBridge');
    });

    // Listen data from Middler Connector and forward it to client
    BridgeHost.on('data', (data) => {
        host.write(data);
        //log(data, 'FromBridgeToClient');
    });

    // Close VirtualHost if error occurs
    BridgeHost.on('error', () => host.close());
});

// Start listening on port
tunnel.listen(config.port.tunnel, config.ip.tunnel, (err) => {
    if (err) throw err;
    log(`Tunnel is running on ${config.port.tunnel}.`);
});