const express = require("express");
const app = express();

app.use(express.json());
app.use('/monaco-editor', express.static(__dirname + '/node_modules/monaco-editor/min/vs/'));

const port = 80;

const fsF = require("./lib/fsF");

const allStringify = require("./lib/allStringify");

const {VM} = require('vm2');
const vmDefaultTimeout = 5000;
const vm = new VM({
    timeout: vmDefaultTimeout,
    allowAsync: false,
    sandbox: {}
});

const vmList = [];


app.get("/", (req, res) => {
    res.sendFile(__dirname+"/");
});

app.post('/createSection', (req, res) => {
    var data = req.body;

    if(!data?.name)
        return res.send(`{"error": true, "response": "No section name found. Correct data example: {name: 'mySection'}"}`);

    try {
        vm.run("var "+ data.name + " = 0;");
    } catch (err){ 
        return res.send(`{"error": true, "response": "Bad structured section name. Section names should not start with number, have no expecial character and no spaces, example: mySectionName2"}`);
    }

    var sectionList = fsF.getSectionList();
    var existsInList = sectionList.map(e=>e.name).includes(data.name);

    if(existsInList){
        res.send(`{
            "error": true,
            "response": "Section '${data.name}' already exists. If you are the owner of this sections use '/deleteSection' and parse it's 'sectionId' to terminate it."
        }`);

    } else {
        fsF.createSection(data.name);

        res.send(JSON.stringify(fsF.getSection(data.name)));
    }


});

app.post('/sectionChangeInfo', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    var section = fsF.getSection(data.sectionName);

    if(section.error)
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    if(data.sectionId != section.id)
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

    var response = "";

    if(data.newName) {
        try {
            vm.run("var "+ data.newName + " = 0;");
        } catch (err){ 
            return res.send(`{"error": true, "response": "Bad structured section name. Section names should not start with number, have no expecial character and no spaces, example: mySectionName2"}`);
        }
    
        var sectionList = fsF.getSectionList();
        var existsInList = sectionList.map(e=>e.name).includes(data.newName);

        if(existsInList){
            return res.send(`{
                "error": true,
                "response": "Section '${data.newName}' already exists. If you are the owner of this sections use '/deleteSection' and parse it's 'sectionId' to terminate it."
            }`);

        } else {
            response += `Section '${section.name}' changed to '${data.newName}'. `;

            section.name = data.newName;
        }
    
    }

    if(data.newId){
        try {
            vm.run("var "+ data.newName + " = 0;");
        } catch (err){ 
            return res.send(`{"error": true, "response": "Bad structured section name. Ids names should not start with number, have no expecial character and no spaces, example: myNewId2"}`);
        }

        response += `Section '${section.name}' id successfully changed'. `;

        section.id = data.newId;

    }

    fsF.saveData(data.sectionName, section);

    res.send(`{"error": false, "response": "${response}"}`);
});

app.post('/section', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var ret = `{
                "error": false,
                "response": "See the '${data.sectionName}' section in this object's .data element.",
                "data": ${JSON.stringify(section)}
            }`;

            res.send(ret);

        }
    }
});



app.post('/run', (req, res) => {
    var data = req.body;

    if(!data?.run)
        return res.send(`{"error": true, "response": "No .run element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);
    
    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var run, gotError = false; 

            if(!vmList.find(e => e.id == section.vmId)){
                vmList.push({
                    id: section.vmId,
                    vm: new VM({
                        timeout: vmDefaultTimeout,
                        allowAsync: false,
                        sandbox: {}
                    }),
                    cSVm: new VM({
                        timeout: vmDefaultTimeout,
                        allowAsync: false,
                        sandbox: {}
                    })
                })
            }
            
            var thisVm = vmList.find(e => e.id == section.vmId);

            try {
                run = thisVm.vm.run(data.run);
            } catch (err) {
                gotError = true;
                run = err;
            }

            var ret = `{
                "error": ${gotError},
                "response": "${allStringify(run, true)}"
            }`;

            console.log(allStringify(run));

            fsF.historyAdd(data.sectionName, data.run);

            res.send(ret);

        }
    }
});


app.post('/history', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var fullScript = fsF.history(data.sectionName);

            res.send(`{
                "error": ${false},
                "response": "See the '${data.sectionName}' history in this object's .data element.",
                "data": ${fullScript.scriptList}
            }`);

        }
    }
});

app.post('/historyClear', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            fsF.historyClear(data.sectionName);

            res.send(`{
                "error": ${false},
                "response": "Cleared '${data.sectionName}' history."
            }`);

        }
    }
});



app.post('/continousScriptAddLine', (req, res) => {
    var data = req.body;

    if(!data?.run)
        return res.send(`{"error": true, "response": "No .run element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);
    
    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var fullScript = fsF.continousScriptAddLine(data.sectionName, data.run);

            res.send(`{
                "error": ${false},
                "response": "${fullScript.string}",
                "id": "${fullScript.id}",
                "data": ${fullScript.scriptList}
            }`);

        }
    }
});

app.post('/continousScript', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var fullScript = fsF.continousScript(data.sectionName);

            res.send(`{
                "error": ${false},
                "response": "${fullScript.string}",
                "data": ${fullScript.scriptList}
            }`);

        }
    }
});

app.post('/continousScriptClear', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            fsF.continousScriptClear(data.sectionName);

            res.send(`{
                "error": ${false},
                "response": "Cleared '${data.sectionName}' script."
            }`);

        }
    }
});

app.post('/continousScriptRemoveLine', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', lineId: 'myLineId'"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', lineId: 'myLineId'"}`);

    if(!data?.lineId)
        return res.send(`{"error": true, "response": "No .lineId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', lineId: 'myLineId'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            fsF.continousScriptRemoveLine(data.sectionName, data.lineId);

            res.send(`{
                "error": ${false},
                "response": "Removed line '${data.lineId}' from continuous script."
            }`);

        }
    }
});

app.post('/continousScriptRun', (req, res) => {
    var data = req.body;

    if(!data?.sectionName)
        return res.send(`{"error": true, "response": "No .sectionName element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);

    if(!data?.sectionId)
        return res.send(`{"error": true, "response": "No .sectionId element found. Correct data example: {sectionName: 'mySection', sectionId: 'mySectionId', run: 'myCode'}"}`);


    var section = fsF.getSection(data.sectionName);

    if(section.error){
        return res.send(`{"error": true, "response": "Section '${data.sectionName}' not found."}`);

    } else {
        if(data.sectionId != section.id){
            return res.send(`{"error": true, "response": "Section '${data.sectionName}' wrong id."}`);

        } else {
            var fullScript = fsF.continousScript(data.sectionName);
            
            var run, gotError = false; 

            if(!vmList.find(e => e.id == section.vmId)){
                vmList.push({
                    id: section.vmId,
                    vm: new VM({
                        timeout: vmDefaultTimeout,
                        allowAsync: false,
                        sandbox: {}
                    }),
                    cSVm: new VM({
                        timeout: vmDefaultTimeout,
                        allowAsync: false,
                        sandbox: {}
                    })
                })
            }
            
            var thisVm = vmList.find(e => e.id == section.vmId);

            try {
                run = thisVm.cSVm.run(data.run);
            } catch (err) {
                gotError = true;
                run = err;
            }
            res.send(`{
                "error": ${gotError},
                "response": "${run}"
            }`);

        }
    }
});


app.listen(port, ()=>{
   // console.clear();
    
    console.log("run");
});