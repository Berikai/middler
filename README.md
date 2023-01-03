<h1 align="center">⚠️THE PROJECT IS UNDER HEAVY DEVELOPMENT!</h1>

<p align="center">
  <a href="https://www.flaticon.com/authors/dinosoftlabs">
    <img alt="logo" src="https://user-images.githubusercontent.com/18515671/210345521-5f448bdd-72dd-42b6-b3b5-34f42530403b.png" width="100" />
  </a>
</p>

<div align="center"> Icons made by <a href="https://www.flaticon.com/authors/dinosoftlabs" title="DinosoftLabs">DinosoftLabs</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><br />


<h1 align="center">
  Middler | TCP Client-Host Virtualization Bridge
</h1>

<p align="center"><a href="https://en.wikipedia.org/wiki/Open_source"><img alt="open-source" src="https://img.shields.io/badge/OPEN-SOURCE-C13D3B?style=for-the-badge&labelColor=EA4761"></a> <a href="https://choosealicense.com/licenses/mit"><img alt="license-mit" src="https://img.shields.io/badge/LICENSE-MIT-D15E28?style=for-the-badge&labelColor=E36D26">
</a></p>

## Description

Middler is a TCP connection bridge that connects clients and hosts by forwarding their comminucation on virtualized layers. Written in NodeJS.

## Purpose

It is created to be used in purposes like how Hamachi or RadminVPN is used for making local servers accessible without port forwarding. Middler makes it easy for clients to connect hosts by just providing a connection address. Clients are not installing any Middler program!

It actually seems like it does what ngrok does, but it's not working the same way.

## Usage

There are 3 ways to use Middler.

 - As an host, you have a local server that you want to make clients connected. Set the config up and run the Middler Connector to connect the Middler Tunnel. Once you connected, you recieve an ip. Share it with your clients to make them connect to your local server.

 - As a client, you don't have anything about Middler to be installed! Just connect the host server via the ip Tunnel has given to Connector.

 - As a Tunnel provider, set the config up and run the Middler Tunnel. Make sure your ports are working fine.

To run Middler Tunnel: `node src/tunnel start [config_arguments]`

To run Middler Connector: `node src/connector connect [config_arguments]`

## How it works

![Middler Diagram](https://user-images.githubusercontent.com/18515671/210378000-b024a1a4-c2dc-44b1-a577-c68c1b07d5e5.svg)

It is made of two main layers: Tunnel and Connector. These layers forwarding TCP packets each other. Since it is a bidirectional comminication between Connector and Tunnel; to seperate, determine and process all the different client packets, it uses some prefixes.

### Middler Tunnel

Middler Tunnel is a TCP server. It creates a VirtualHost when a new host connects to Tunnel with Connector and creates a new TCP server for it on a port. It forwards the data from connected clients to host's Connector.

### Middler Connector

Middler Connector is a TCP client to connect Tunnel for hosts. It creates a VirtualClient when it recieves the information data of a new client is connected to the VirtualHost that represents this host on Tunnel and it makes the VirtualClients that is created on the host's machine with Middler Connector to connect host's local server.

### Middler Prefixes

Middler Prefixes are prefixes that are added at the beginning of the TCP packets that is being sent between Connector and Tunnel.

 - `HOST_PORT` is used to let Connector know which port VirtualHost is listening. (e.g. HOST_PORTtcp.middler.io:54988)
 - `NEW_CLIENT` is used to let Connector know that a new client is connected to VirtualHost with given id. (e.g. 198739854745NEW_CLIENT)
 - `CLIENT_LOST` is used to let Connector know that a connection between a client and VirtualHost is lost. (e.g. 198739854745CLIENT_LOST)
 - `{ClientID}` ClientID is used to let Connector know which client sending the coming data by VirtualHost. (e.g. 198739854745{data_from_client})

## Licence

This project is licensed under [MIT](LICENSE).

## Contrubution
Pull requests are welcome!

## Support

If you find this project interesting then consider buying a coffee for me 👇

<p><a href="https://www.buymeacoffee.com/verdant" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="196" /></a></p>


or you can donate in crypto! 💖

<b>Bitcoin</b>
> 19ZopJi8YGz32XQwWyxhbcAwMt6yDh6Qho

<b>Ethereum</b>
> 0x3aCdA83c0EAD65033cD532357De3c8B71b1C94d5

<b>Binance Smart Chain</b>
> 0x3aCdA83c0EAD65033cD532357De3c8B71b1C94d5

<b>Polygon</b>
> 0x3aCdA83c0EAD65033cD532357De3c8B71b1C94d5

<b>Solana</b>
> G92WzULy5D3sA5pBisViEPn5X3umEJnFU59uALaCL69p
