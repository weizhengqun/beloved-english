const Koa = require('koa');
const Router = require('koa-router');
const util = require('util');
const cors = require('koa2-cors')

const app = new Koa();
const router = new Router();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://database-server';

app.use(cors({
    allowMethods: ['GET']
}));
router.get('/api/lessons', async (ctx, next) => {
    try {
        let connect = await MongoClient.connect(url, {
            useNewUrlParser: true
        });
        let db = connect.db('beloved_english');
        let query = {
            level: ctx.query.level,
            lesson: ctx.query.lesson
        };
        console.log(query);
        let records = await db.collection('lessons').findOne(query);
        ctx.body = records;
        console.log(util.inspect(records, false, null, true));
        connect.close();
    } catch (e) {
        console.error(e);
    }
});

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3001);