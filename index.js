require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const client = new MongoClient(process.env.MONGO_DB_URI);

async function connectToMongoDB() {
    try {
        await client.connect();

        const database = client.db("biblioDrop");
        const booksCollection = database.collection("books");


        // Librayan Add Books Collection
        app.post('/api/addBooks', async (req, res)=>{

            const kooks = req.body;
            const result = await booksCollection.insertOne(kooks);
            res.send(result)
        })
        //

        app.get('/api/books', async (req, res) =>{
            const query = {

            }
            if (req.query.publisher){
                query.publisher = req.query.publisher;
            }
            if (req.query.status){
                query.status = req.query.status;
            }

            const cursor = booksCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })







        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error(err);
    }
}

connectToMongoDB();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});