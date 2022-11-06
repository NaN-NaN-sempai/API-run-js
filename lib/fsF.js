const fs = require("fs");
const uuid = require("./uuid");

var folderDir = './sections/';


const historyMaxSize = 20;

var retObj = {
    getSectionList: () => {
        var nameList = fs.readdirSync(folderDir);
        
        var retNameList = [];

        nameList.forEach(folder => {
            var jsonFile = fs.readFileSync(folderDir + folder);
            
            retNameList.push(JSON.parse(jsonFile));
        });

        return retNameList;
    },

    createSection: (sectionName) => {
        fs.writeFileSync(folderDir + sectionName+".json", `{
            "name": "${sectionName}",
            "id": "${uuid()}",
            "vmId": "${uuid('vmId')}" 
        }`);
    }
}

retObj.getSection = (name) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    return section? section: {
        error: true,
        response: "File not found."
    }
}


retObj.saveData = (name, data) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(data.name != name){
        fs.unlinkSync(folderDir + name + ".json");
    }

    if(!section.error){
        fs.writeFileSync(folderDir + data.name + ".json", JSON.stringify(data,  null, 4));
    }
}


retObj.history = (name) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        if(!data.history){
            data.history = [];
        }
        
        retObj.saveData(section.name, data);


        return {
            scriptList: JSON.stringify(data.history)
        };
    }
        
}

retObj.historyAdd = (name, code) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        var newLine = {
            code,
            date: new Date(),
            id: uuid("hist")
        }

        if(data.history){           
            data.history.unshift(newLine);

            data.history = data.history.slice(0, historyMaxSize);

        } else {
            data.history = [newLine];
        }
        
        retObj.saveData(section.name, data);
    }
        
}

retObj.historyClear = (name) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        data.history = [];
        
        retObj.saveData(section.name, data);
    }
        
}


retObj.continousScript = (name) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        if(!data.continousScript){
            data.continousScript = [];
        }
        
        retObj.saveData(section.name, data);

        return {
            string: data.continousScript.map(e => e.code).join(" "),
            scriptList: JSON.stringify(data.continousScript)
        };
    }
        
}

retObj.continousScriptAddLine = (name, code) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        var newLine = {
            code,
            date: new Date(),
            id: uuid("line")
        }

        if(data.continousScript){
            data.continousScript.push(newLine)

        } else {
            data.continousScript = [newLine];
        }
        
        retObj.saveData(section.name, data);

        return {
            string: data.continousScript.map(e => e.code).join(" "),
            scriptList: JSON.stringify(data.continousScript),
            id: newLine.id
        };
    }
        
}

retObj.continousScriptClear = (name) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        data.continousScript = [];
        
        retObj.saveData(section.name, data);

        return {
            string: data.continousScript.map(e => e.code).join(" "),
            scriptList: JSON.stringify(data.continousScript)
        };
    }
        
}

retObj.continousScriptRemoveLine = (name, lineId) => {
    var section = retObj.getSectionList().find(s => s.name == name);

    if(!section.error){
        var jsonFile = fs.readFileSync(folderDir + section.name + ".json");
        
        var data = JSON.parse(jsonFile);

        if(!data?.continousScript){
            data.continousScript = [];
        }

        var wantedFile = data.continousScript.find(e => e.id == lineId);

        data.continousScript = data.continousScript.filter(e => e != wantedFile);
        
        retObj.saveData(section.name, data);

        return {
            string: data.continousScript.map(e => e.code).join(" "),
            scriptList: JSON.stringify(data.continousScript)
        };
    }
        
}

module.exports = retObj

