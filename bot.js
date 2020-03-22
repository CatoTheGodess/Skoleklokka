const Discord = require('discord.js');
const fs = require('fs')
const client = new Discord.Client();
const guild = new Discord.Guild();
const chanman = new Discord.ChannelManager(client);
var date = new Date();

var auth = require('./auth.json');
var timer = require('./timer.json');

var isReady = true;

var prefix = ".!";

const telleTall = ["første", "andre", "tredje", "fjerde", "femte", "sjette", "sjuende", "åttende"]

// Embed for .!help
const helpEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Kommandoer')
    .setDescription('Her er noen kommandoer denne botten forstår')
    .addField(`${prefix}help`, 'Tar deg hit')
    .addField(`${prefix}timeplan`, 'Viser en enkel oversikt over når øktene starter og slutter')
    .addField(`${prefix}time`, 'Sjekker hvilken økt det er og når den slutter. Tar utgangspunkt fra nåværende tidspunkt')
    .addField(`${prefix}time [HH:MM]`, 'Sjekker hvilken økt det er og når den slutter. Botten vil ta utgangspunkt til det tidspunktet som er gitt',true)
    .addField(`${prefix}time neste`, 'Sjekker når neste økt starter. Botten vil ta utgangspunkt til det tidspunktet som er gitt',true)
    .addField(`${prefix}<lydfil>?`, 'Er lydfilen installert av admin, kan den spilles av med denne kommandoen.')
    .setFooter('Hilsen Syver ;)');



// Returns state right now. (In class or not, etc)
function returnCurrentPeriod(skole, when = getClock()) {
    let checkOkt = 0;
    if (timeToMilli(when) <= timeToMilli(timer[skole].timer[timer[skole].timer.length - 1].slutt) && timeToMilli(when) >= timeToMilli(timer[skole].timer[0].start)) {
        // tidspunktet er i skoletiden
        while (timer[skole].timer[checkOkt]) {
            if (timeToMilli(when) >= timeToMilli(timer[skole].timer[checkOkt].start) && timeToMilli(when) <= timeToMilli(timer[skole].timer[checkOkt].slutt)) {
                // tidspunktet er inni aktuell time
                return ["iøkt", timer[skole].timer[checkOkt], checkOkt]
            } else if (checkOkt !== timer[skole].timer.length - 1 && timeToMilli(when) > timeToMilli(timer[skole].timer[checkOkt].slutt) && timeToMilli(when) < timeToMilli(timer[skole].timer[checkOkt + 1].start)) {
                // tidspunktet er etter aktuell time og før timen etter, hvis ikke aktuell time er siste time
                return ["pausefør", timer[skole].timer[checkOkt + 1], checkOkt + 1]
                break
            } else {
                checkOkt++;
            }
        }
    } else if (Date.parse("01/01/2020 " + when) < Date.parse("01/01/2020 " + timer[skole].timer[0].start)) {
        // hvis før skolen
        return ["førSkole"]
    } else if (Date.parse("01/01/2020 " + when) > Date.parse("01/01/2020 " + timer[skole].timer[timer[skole].timer.length - 1].start)) {
        // hvis etter skolen
        return ["etterSkole"]
    } else {
        console.error("could not find time in day")
    };
}

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function makeTimeplanEmbed(msg) {
    let timeplanEmbed = new Discord.MessageEmbed()
    let school = msg.channel.name.split("-")[0]
    timeplanEmbed.setDescription(`Timeplan for ${timer[school].fullName}`)
    for (let i = 0; i < timer[school].timer.length; i++) {
        let stringsToBeAdded = [`${telleTall[i].capitalizeFirstLetter()} økt:`, `${timer[school].timer[i].start} - ${timer[school].timer[i].slutt}`]
        let currentPeriod = returnCurrentPeriod(school)
        if (currentPeriod[0] === "iøkt" && timer[school].timer[i] === currentPeriod[1]) {
            stringsToBeAdded.forEach(function(part, index, theArray) {
                theArray[index] = "**" + part + "**";
              });
            console.log(stringsToBeAdded)

        }
        timeplanEmbed.addField(stringsToBeAdded[0],stringsToBeAdded[1])
    }
    return timeplanEmbed
}

function howLongSinceUntil(sinceUntilThis, stringReturn = false, allowSince = false, fromTime = getClock(), depth = 2) {
    let difference = timeToMilli(sinceUntilThis) - timeToMilli(fromTime)
    let result;
    let timeArray;

    if (difference >= 0) {
        // tid til
        result = milliToTime(difference)
    } else if (difference <= 0 && allowSince){
        // tid siden
        result = milliToTime(difference * -1) + " siden"
    } else {
        result = milliToTime(timeToMilli(sinceUntilThis) + 86400000 - timeToMilli(fromTime))
    }

    console.log(result)

    if (stringReturn) {
        let timeArr = result.split(" ")[0].split(":")
        timeArray = result.split(" ")[0].split(":")
        if (timeArray[0].slice(0,1) == 0) { timeArray[0] = timeArray[0].slice(1)}
        if (timeArray[1].slice(0,1) == 0) { timeArray[1] = timeArray[1].slice(1)}
        if (timeArray[0] > 1) { timeArray[0] = timeArray[0] + " timer" } else { timeArray[0] = timeArray[0] + " time" }
        if (timeArray[1] > 1) { timeArray[1] = timeArray[1] + " minutter" } else { timeArray[1] = timeArray[1] + " minutt" }
        if (depth === 2) {
            if (result.split(" ")[1] === "siden") {
                if (timeArr[0] == 00 && timeArr[1] == 00) { return `nå` }
                else if (timeArr[0] == 00) { return `for ${timeArray[1]} siden` }
                else { return `for ${timeArray[0]} og ${timeArray[1]} siden` } }
            else {
                if (timeArr[0] == 00 && timeArr[1] == 00) { return `nå` }
                else if (timeArr[0] == 00) { return `om ${timeArray[1]}` }
                else { return `om ${timeArray[0]} og ${timeArray[1]}` }
            }
            
            
            
        } else if (depth === 3) {
            if (!(timeArray[2] === 1)) { timeArray[2] = timeArray[2] + " sekunder" } else { timeArray[2] = timeArray[2] + " sekund" }
            if (result.split(" ")[1] === "siden") { return `for ${timeArray[0]}, ${timeArray[1]} og ${timeArray[2]} siden` }
            else { return `om ${timeArray[0]}, ${timeArray[1]} og ${timeArray[2]}` }
            
        } else {
            console.error("howLongSinceUntil only takes depth 2 or 3 at the moment!");
        }
    } else {
        return result;
    }
    
}

function getClock() {
    date = new Date();
    let milliseconds = date.getMilliseconds(),
        seconds = date.getSeconds(),
        minutes = date.getMinutes(),
        hours = date.getHours()

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;


}

function objectLength(object) {
    return Object.keys(object).length;
}

function getNameByIndex(obj, val) {
    return Object.keys(obj)[val].toString()
}

function timeToMilli(handmstring) {
    let arrayTime = handmstring.split(":");
    if (arrayTime.length === 2) {
        return (arrayTime[0] * 3600000 + arrayTime[1] * 60000);
    } else if (arrayTime.length > 2) {
        return (arrayTime[0] * 3600000 + arrayTime[1] * 60000 + arrayTime[2] * 1000);
    }
    
} 6 + milliToTime(2000,false)

function milliToTime(duration, returnString = false) {
    let milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    if (!returnString) {
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        console.log(hours + ":" + minutes + ":" + seconds + "." + milliseconds)
        return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    } else {
        if (hours > 1) {
            hours = hours + " timer"
        } else {
            hours = "1 time"
        }
        if (minutes > 1) {
            minutes = minutes + " minutter"
        } else {
            minutes = "1 minutt"
        }
        return hours + " og " + minutes
    }


    
}

var lastNoti = {"school":"","lastTime":""}

//Sjekke etter timer som starter om 5 min
function intervalFunc() {
    date = new Date();
    let totalSchools = objectLength(timer);
    console.log(`[${getClock()}]`);
    for (let skolecount = 0; skolecount < totalSchools; skolecount++) {
        console.log("--- " + getNameByIndex(timer, skolecount) + " ---");
        for (let i = 0; i < timer[getNameByIndex(timer, skolecount)].timer.length; i++) {
            // Notify 5-6 min before event
            if (timeToMilli(getClock()) >= (timeToMilli(timer[getNameByIndex(timer, skolecount)].timer[i].start) - 360000) && timeToMilli(getClock()) <= (timeToMilli(timer[getNameByIndex(timer, skolecount)].timer[i].start) - 300000) && (timeToMilli(getClock()) - lastNoti.lastTime >= 300000)) {
                client.channels.fetch(timer[getNameByIndex(timer, skolecount)].kanal)
                    .then(channel => channel.send("Neste økt starter om 5 min!"))
                    .catch(console.error);
                lastNoti.lastTime = timeToMilli(getClock());
                lastNoti.school = getNameByIndex(timer, skolecount);
                console.log(`class found ${i} sent notification`)
            }
        }
        console.log("checked school")
    }
}


 //-------------------------------------------- MSG

var repeatedStrings =
{
    "lastO":"Nå er det siste økt.",
    "afterS":"Skoler en over for idag!",
    "beforeS":"Skolen har ikke startet ennå.",
    "break":"Nå er det pause"
}

function msgNextOkt(msg, skole, when = getClock()) {
    let currentPeriod = returnCurrentPeriod(skole,when)
    
    console.log(currentPeriod)
    
    switch (currentPeriod[0]) {
        case "iøkt":
            if (currentPeriod[2] === timer[skole].timer.length - 1) {
                // gjør dette hvis tidspunktet er i siste time.
                msg.channel.send(`${repeatedStrings.lastO} Neste økt er ${telleTall[0]} økt i morgen kl. ${timer[skole].timer[0].start}. (${howLongSinceUntil(timer[skole].timer[0].start, true, false, when)})`);
            } else {
                // gjør dette hvis tidspunktet er i en time
                msg.channel.send(`Nå er det time. Neste økt er ${telleTall[currentPeriod[2] + 1]} økt kl. ${timer[skole].timer[currentPeriod[2] + 1].start} (${howLongSinceUntil(timer[skole].timer[currentPeriod[2] + 1].start, true, false, when)})`);
            };
            break;
        case "etterSkole":
            msg.channel.send(`${repeatedStrings.afterS} Neste økt er ${telleTall[0]} økt i morgen kl. ${timer[skole].timer[0].start}. (${howLongSinceUntil(timer[skole].timer[0].start, true, false, when)})`);
            break;
        case "førSkole":
            msg.channel.send(`${repeatedStrings.beforeS} Første time starter ${timer[skole].timer[0].start}. (${howLongSinceUntil(timer[skole].timer[0].start, true, false, when)})`);
            break;
        case "pausefør":
            msg.channel.send(`${repeatedStrings.break} Neste økt er ${telleTall[currentPeriod[2]]} økt kl. ${timer[skole].timer[currentPeriod[2]].start} (${howLongSinceUntil(timer[skole].timer[currentPeriod[2]].start, true, false, when)})`)
            break;
        default:
            msg.channel.send("Noe gikk galt! Det kan hende timene ikke er satt opp for denne skolen. Kontakt admin.");
            console.error("Missing hours or error");
    }

};

function msgCurrentOkt(msg, skole, when = getClock()) {
    let currentPeriod = returnCurrentPeriod(skole,when)
    
    console.log(currentPeriod)
    
    switch (currentPeriod[0]) {
        case "iøkt":
            if (currentPeriod[2] === timer[skole].timer.length - 1) {
                // gjør dette hvis tidspunktet er i siste time.
                msg.channel.send(`${repeatedStrings.lastO} Timen slutter kl. ${timer[skole].timer[currentPeriod[2]].slutt} (${howLongSinceUntil(timer[skole].timer[currentPeriod[2]].slutt, true, false, when)})`);
            } else {
                // gjør dette hvis tidspunktet er i en time
                msg.channel.send(`Nå er det ${telleTall[currentPeriod[2]]} økt. Timen slutter kl. ${timer[skole].timer[currentPeriod[2]].slutt} (${howLongSinceUntil(timer[skole].timer[currentPeriod[2]].slutt, true, false, when)})`);
            };
            break;
        case "etterSkole":
            msg.channel.send(repeatedStrings.afterS);
            break;
        case "førSkole":
            msg.channel.send(repeatedStrings.beforeS);
            break;
        case "pausefør":
            msg.channel.send(repeatedStrings.break);
            break;
        default:
            msg.channel.send("Noe gikk galt! Det kan hende timene ikke er satt opp for denne skolen. Kontakt admin.");
            console.error("Missing hours or error");
    }

};



//------------------------------------------------ON


client.on('ready', async () => {
    try {
        throw new Error('Omg');
    } catch (e) {
        console.log(`Logged in as ${client.user.tag}!`);
        setInterval(intervalFunc, 20000)
        client.user.setPresence({ activity: { name: `tikkelyder. "${prefix}"` }, status: 'available' })
            .catch(console.error);
    }
});

client.on('message', msg => {
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;
    const args = msg.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    if (command === `setchannel` && msg.member.roles.cache.some(role => role.name === 'Vaktmester')) {
        console.log(msg.channel.id)
        const setchannel = msg.channel;
        if (!args[0]) {
            msg.channel.send("Du må skrive forkortelsen til skolen du vil binde til kanalen. (eks.)");
        } else {
            msg.reply(`Setter denne kanalen (${msg.channel.id}) som kanal for ${args[0]}!`);
            var timerContent = fs.readFileSync("timer.json");
            var timerJson = JSON.parse(timerContent);
            console.log(timerJson);
            if (!timerJson[args[0]]) { timerJson[args[0]] = { 'timer': [], 'kanal': '' }; };
            timerJson[args[0]].kanal = msg.channel.id;
            console.log(timerJson);
            fs.writeFileSync("timer.json", JSON.stringify(timerJson));
            
            setchannel.setName(`${args[0]}-skoletimer`);
            setchannel.setTopic(`Dette er skoletime-kanalen for ${timer[args].fullName}.`);
        };

    } else if (command === `time`) {
        var schoolname = msg.channel.name.split("-")[0]
        if (!args[0] || args[0] === `info`) {
            if (!timer[schoolname]) {
                msg.channel.send("Kanalen du bruker ble ikke gjenkjent.");
            } else {
                msgCurrentOkt(msg, schoolname);
            };

        } else if (args[0] === `neste`) {

            if (!timer[schoolname]) {
                msg.channel.send("Kanalen du bruker ble ikke gjenkjent.");
            } else {
                msgNextOkt(msg, schoolname);
            };

        } else if (/[0-2]\d:[0-6]\d/.test(args[0])) {
                 msg.channel.send(`Bruker tidspunkt ${args[0]}.`);
                msgNextOkt(msg, schoolname, args[0]);

        } else { msg.reply("Tidspunktet må være i formatet TT:MM.") };
    } else if (command === `help` || command === `hjelp`) {
        if (!timer[msg.channel.name.split("-")[0]]) {
            msg.channel.send("Kommandoene som vises vil ikke fungere i denne kanalen. Vennlgst gå til skoletime-kanalen.");
        }
        msg.channel.send(helpEmbed);
    } else if (command === `timeplan`) {
        if (!timer[msg.channel.name.split("-")[0]]) {
            msg.channel.send("Kanalen du bruker ble ikke gjenkjent.");
        } else {
            msg.channel.send(makeTimeplanEmbed(msg))
        };
    } else if (command === "cato") {
        msg.channel.send("Cato? CATO?! Neii")
    } else if (isReady && /\w*\?/.test(command)){
        let match = /(\w*)\?/.exec(command)
        console.log(match)
        console.log(match[1])
        isReady = false;
        var voiceChannel = msg.member.voice.channel;
        let files = fs.readdirSync('./src/')
        console.log(files)
        if (files.indexOf(match[1] + ".mp3") > -1) {
            msg.delete()
            console.log("kjskld")
            let ender = () => {
                msg.member.voice.channel.leave();
            };
            voiceChannel.join().then(connection => {
                const dispatcher = connection.play(`./src/${match[1]}.mp3`)
                dispatcher.setVolume(0.5)
                dispatcher.on("finish", ender);
            }).catch(err => console.log(err));
            isReady = true;
        } else {
            msg.channel.send("Fant ikke den filen.")
            isReady = true;
        }
    };
})

function arrayContains(needle, arrhaystack)
{
    return (arrhaystack.indexOf(needle) > -1);
}

client.on('guildMemberAdd', member => {
    member.send("Hei! Jeg er fra Skolegården og jeg er en klokke, men nå skal jeg fortelle deg noe annet enn tiden!\n\nVaktmesteren registrerer medlemmer manuelt. For å kunne delta i samtaler og få elev-rollen må du **sende en melding** med Discord-taggen din og skolen du går på til **SYV1002** på Teams. Da kan han verifisere at du er deg. \n(Finner du han ikke ved søkelinjen, trykk \"Søk etter SYV1002\" og så \"Personer\". Der skal du kunne se Syver Stensholt.");
});

client.login(auth.token);