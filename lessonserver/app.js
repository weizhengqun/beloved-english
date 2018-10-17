const Koa = require('koa');
const Router = require('koa-router');
const util = require('util');

const app = new Koa();
const router = new Router();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-server';

router.get('/api/lessons', async(ctx, next) => {
    try {
        let connect = await MongoClient.connect(url, {
            useNewUrlParser: true
        });
        let db = connect.db('beloved_english');
        let query = {
            Level: ctx.query.Level,
            Lesson: ctx.query.Lesson
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

app.listen(3000);
