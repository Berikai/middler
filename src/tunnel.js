const net = require('net');
const log = require('./libs/log');
const ascii_to_hex = require('./libs/ascii_to_hex');

const config = {
    ip: {
        tunnel: '192.168.1.19',
        virtual_host: 'tcp.middler.io'
    },
    port: {
        tunnel: 51781
    },
};

const HostManager = new function () {
    this.hosts = [];
    this.createPort = () => { // MAKE IT BETTER <<<
        let port = Math.floor(Math.random() * 10000) + config.port.tunnel + 1;
        let samePorts = this.hosts.filter((host) => {
            return host.port == port;
        }).length;
        if (samePorts < 1) return port;
        else this.createPort();
    }; // <<<
    this.pushHost = (host) => {
        this.hosts.push(host);
    };
    this.removeHost = (port) => {
        this.hosts.map((host, i) => {
            if (host.port == port) this.hosts.splice(i, 1);
        });
    };
};

const VirtualHost = function () {
    this.callbacks = {
        data: [],
        write: [],
        client_close: [],
    }; // callbacks will be stored here
    this.port = HostManager.createPort();
    this.write = (data) => {
        if (Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex') == 'CLIENT_LOST') {
            this.callbacks['client_close'].map(listener => listener(data));
        } else {
            this.callbacks['write'].map(listener => listener(data));
        }
    };
    this.close = () => this.host.close();
    this.host = new net.Server(); // create host
    this.host.on('connection', Client => {
        const id = Math.floor(Math.random() * 900000000000) + 100000000000; // create id which has length of 12
        log(`New client created: Client${id}`, `VirtualHost:${this.port}`);
        this.callbacks['data'].map(listener => listener(`${id}NEW_CLIENT`));
        Client.on('data', data => this.callbacks['data'].map(listener => listener(Buffer.from(ascii_to_hex(id.toString()) + data.toString('hex'), 'hex'))));
        Client.on('error', (err) => log(err, `Client${id}_Host:${this.port}`));
        Client.on('close', () => {
            this.callbacks['data'].map(listener => listener(`${id}CLIENT_LOST`));
            log('Client closed.', `Client${id}_Host:${this.port}`)
        });
        this.on('client_close', (data) => Buffer.from(data.toString('hex').substring(0, 24), 'hex') == id ? Client.destroy() : {});
        this.on('write', (data) => Buffer.from(data.toString('hex').substring(0, 24), 'hex') == id ? Client.write(Buffer.from(data.toString('hex').substring(24, data.toString('hex').length), 'hex')) : {}); //<<<<<<<<<<<
    });
    this.host.on('error', (err) => log(err, `VirtualHost:${this.port}`));
    this.host.on('close', () => {
        log('Host closed.', `VirtualHost:${this.port}`);
        HostManager.removeHost(this.port);
    });
    this.on = (event, listener) => {
        if (event == 'data')
            this.callbacks['data'].push(listener);
        if (event == 'write')
            this.callbacks['write'].push(listener);
        if (event == 'client_close')
            this.callbacks['client_close'].push(listener);
    };
    this.host.listen(this.port, config.ip.tunnel, (err) => {
        if (err) log(`Error: New virtual host CANNOT be created on ${this.port}.`, 'Tunnel');
        log(`New virtual host is running on ${this.port}.`, 'Tunnel');
        this.callbacks['data'].map(listener => listener(`HOST_PORT${config.ip.virtual_host}:${this.port}`));
        HostManager.pushHost({
            port: this.port
        });
    });
};

const tunnel = net.createServer(BridgeHost => {
    const host = new VirtualHost(); // create new simulated host when a new wr2 bridge host connects
    //BridgeHost.write('111.111.111.111:11111');

    host.on('data', (data) => {
        BridgeHost.write(data);
        //log(data, 'FromClientToBridge');
    });
    BridgeHost.on('data', (data) => {
        host.write(data);
        //log(data, 'FromBridgeToClient');
    });
    BridgeHost.on('error', () => host.close());
});

tunnel.listen(config.port.tunnel, config.ip.tunnel, (err) => {
    if (err) throw err;
    log(`Tunnel is running on ${config.port.tunnel}.`);
});