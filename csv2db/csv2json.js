const fs = require('fs');
const readline = require('readline');
const util = require('util');

let files = new Array();

function check_files() {
    files.forEach((file) => {
        fs.access(file, fs.constants.F_OK, (err) => {
            if (err) console.error(`${file} 'does not exist'`);
        });
    });
}

function get_props(cols) {
    let obj_props = new Array();
    cols.forEach((col) => {
        if (col !== '') {
            let cur_prop = col.split('|');
            let tmp_prop = new Object();

            tmp_prop.name = cur_prop[0].replace(/^\s+|\s+$/g, '');
            tmp_prop.type = 'Value';
            tmp_prop.is_file = false;
            for (let i = 1; i < cur_prop.length; i++) {
                if (cur_prop[i] === 'File') {
                    tmp_prop.is_file = true;
                } else if (cur_prop[i] === 'Array') {
                    tmp_prop.type = cur_prop[i];
                }
            }
            obj_props.push(tmp_prop);
        }
    });
    //    console.log(obj_props);
    return obj_props;
}

function get_object(cols, obj_props) {
    let col_num = 0;
    let json_obj = new Object();

    cols.forEach((col) => {
        if (col !== '') {
            if (obj_props[col_num].is_file === true) {
                files.push(col);
            }
            if (obj_props[col_num].type === 'Array') {
                if (json_obj[obj_props[col_num].name] === undefined) json_obj[obj_props[col_num].name] = new Array();
                json_obj[obj_props[col_num].name].push(col);
            } else {
                json_obj[obj_props[col_num].name] = col;
            }
            col_num++;
        }
    });
    //    console.log(json_obj);
    return json_obj;
}

async function insert_objs(objs) {
    const MongoClient = require('mongodb').MongoClient;
    const url = 'mongodb://mongo-server';

    try {
        let connect = await MongoClient.connect(url, {
            useNewUrlParser: true
        });
        let db = connect.db('beloved_english');
        let result = await db.collection('lessons').insertMany(objs);
        let records = await db.collection('lessons').find().toArray();
        console.log(util.inspect(records, false, null, true));
        connect.close();
    } catch (e) {
        console.error(e);
    }
    return await 0;
}

function main() {
    if (process.argv.length < 3) {
        console.log('Usage:node csv2json.js cvsfile');
        return;
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(process.argv[2]),
        crlfDelay: Infinity
    });

    let read_props = false;
    let cur_props;
    let cur_array;
    let is_object = false;
    let obj_chain = new Array();
    let cur_obj = new Object();

    rl.on('line', (line) => {
        let cols = line.split(',');

        switch (cols[0].replace(/^\s+|\s+$/g, "")) {
            case 'ObjectStart':
                let cur_stack = {
                    obj: cur_obj,
                    sub_obj_name: cols[1].replace(/^\s+|\s+$/g, "")
                };
                obj_chain.push(cur_stack);
                read_props = true;
                is_object = true;
                break;
            case 'ObjectEnd':
                let parent_stack = obj_chain.pop();
                parent_stack.obj[parent_stack.sub_obj_name] = cur_obj;
                cur_obj = parent_stack.obj;
                break;
            case 'ArrayStart':
                read_props = true;
                is_object = false;
                cur_array = new Array();
                break;
            case 'ArrayEnd':
                cur_obj[cols[1].replace(/^\s+|\s+$/g, "")] = cur_array;
                break;
            default:
                if (read_props) {
                    cur_props = get_props(cols);
                    read_props = false;
                } else if (obj_chain.length > 0) {
                    let tmp_obj = get_object(cols, cur_props);
                    if (is_object) {
                        cur_obj = tmp_obj;
                        is_object = false;
                    } else {
                        cur_array.push(tmp_obj);
                    }
                }
                break;
        }
    });

    rl.on('close', () => {
        let all_objs = new Array();

        for (let key in cur_obj) {
            if (cur_obj.hasOwnProperty(key) === true) {
                all_objs.push(cur_obj[key]);
            }
        }
        check_files();
        insert_objs(all_objs);
        console.log('process end');
    });
    return 0;
}

main();
