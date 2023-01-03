// MADE BY BERIKAI 2023
// https://github.com/berikai

module.exports = function(log, sender = 'Node') {
    const date = new Date();
    console.log(`(${date.toLocaleTimeString()}) [${sender}] ${log}`);
}