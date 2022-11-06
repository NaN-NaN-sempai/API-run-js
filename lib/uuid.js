const maxN = 1000;

Number.prototype.pad = function(char = "0", max = maxN){
    var thisLength = this.toString().length;
    var maxLength = max.toString().length;
    var stringStart = char.repeat(maxLength).slice(thisLength, maxLength);

    return stringStart + this.toString();
}

const randomId = (size = maxN) => Math.floor(Math.random() * size).pad();

module.exports = (s) => (s?s:"key")+"_"+(new Date().getTime() + "-" + randomId() + "-" + randomId() + "-" + randomId() + "-" + randomId());