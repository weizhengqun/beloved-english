const fs = require("fs");
const readline = require("readline");
const util = require("util");

let csvFile = {
    lineNo: 0,
    fileContents: new Array(),
    objArray: new Array(),
    async readFile(fileName) {
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            crlfDelay: Infinity
        });
        return new Promise((resolve, reject) => {
            try {
                rl.on("line", line => {
                    this.fileContents.push(line);
                });

                rl.on("close", () => {
                    resolve("ok");
                });
            } catch (e) {
                console.log(e);
                reject("error!");
            }
        });
    },
    getLine() {
        if (this.lineNo < this.fileContents.length) {
            let line = this.fileContents[this.lineNo++];
            return line;
        } else {
            return "end";
        }
    },
    getProps(line) {
        let props = new Array();
        let cols = line.split(",");
        for (let i = 0; i < cols.length; i++) {
            if (cols[i] !== "") {
                let items = cols[i].split("|");
                let propObj = {
                    name: items[0],
                    type: items[1]
                };
                props.push(propObj);
            } else {
                break;
            }
        }
        if (props.length === 0) {
            props = undefined;
        }
        return props;
    },
    getObject({
        obj,
        type,
        props
    }, line) {
        let tempObj = new Object();
        let cols = line.split(",");

        for (let i = 0; i < cols.length; i++) {
            if (cols[i] !== "") {
                let tempItem = cols[i];
                if (props[i].type === "Array") {
                    tempItem = cols[i].split("|");
                }
                tempObj[props[i].name] = tempItem;
            }
        }
        if (type === "Array") {
            obj.push(tempObj);
        } else if (type === "Object") {
            for (let key in tempObj) {
                if (tempObj.hasOwnProperty(key) === true) {
                    obj[key] = tempObj[key];
                }
            }
        }
    },
    async insertObjs(objs) {
        const MongoClient = require('mongodb').MongoClient;
        const url = 'mongodb://mongo-server';

        try {
            let connect = await MongoClient.connect(url, {
                useNewUrlParser: true
            });
            let db = connect.db('beloved_english');
            let result = await db.collection('lessons').insertMany(objs);
            console.log(result);
            let records = await db.collection('lessons').find().toArray();
            console.log(util.inspect(records, false, null, true));
            connect.close();
        } catch (e) {
            console.error(e);
        }
        return await 0;
    },
    async processCsvFile(fileName) {
        await this.readFile(fileName);

        let objArray = new Array();
        let objStack = new Array();
        objStack.push({
            obj: objArray,
            type: "Array"
        });

        while (1) {
            let tempObj = new Object();
            let line = this.getLine();
            if (line === "end") {
                this.objArray = objArray;
                this.insertObjs(objArray);
                return;
            }

            let cols = line.split(",");
            switch (cols[0].replace(/^\s+|\s+$/g, "")) {
                case "ObjectStart":
                    objStack.push({
                        obj: new Object(),
                        type: "Object",
                        name: cols[1]
                    });
                    break;
                case "ArrayStart":
                    objStack.push({
                        obj: new Array(),
                        type: "Array",
                        name: cols[1]
                    });
                    break;
                case "ObjectEnd":
                case "ArrayEnd":
                    tempObj = objStack.pop();
                    if (objStack[objStack.length - 1].type === "Object") {
                        objStack[objStack.length - 1].obj[tempObj.name] = tempObj.obj;
                    } else {
                        let tempArray = objStack[objStack.length - 1].obj;
                        tempArray.push(tempObj.obj);
                    }
                    break;
                default:
                    if (objStack[objStack.length - 1].props === undefined) {
                        objStack[objStack.length - 1].props = this.getProps(line);
                    } else {
                        this.getObject(objStack[objStack.length - 1], line);
                    }
                    break;
            }
        }
    }
};

async function main() {
    if (process.argv.length < 3) {
        console.log("Usage:node csv2json.js cvsfile");
        return;
    }

    try {
        await csvFile.processCsvFile(process.argv[2]);
        //tempObj = objStack.pop();
        console.log(util.inspect(csvFile.objArray, false, null, true));
    } catch (e) {
        console.log(e);
    }
}

main();