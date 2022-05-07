module.exports = function(log, sender = 'Node') {
    const date = new Date();
    console.log(`(${date.toLocaleTimeString()}) [${sender}] ${log}`);
}