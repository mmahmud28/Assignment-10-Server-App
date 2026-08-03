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
        const usersCollection = database.collection("user");


        // Librayan Add Books Collection
        app.post('/api/addBooks', async (req, res) => {
            const kooks = req.body;
            const result = await booksCollection.insertOne(kooks);
            res.send(result)
        })
        //

        //librian books collection
        app.get('/api/books', async (req, res) => {
            const query = {

            }
            if (req.query.addedBy) {
                query.addedBy = req.query.addedBy;
            }
            if (req.query.status) {
                query.status = req.query.status;
            }

            const cursor = booksCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })


        //all Books collection
        app.get('/api/allActiveBooks', async (req, res) => {

            const query = {

            }
            if (req.query.status) {
                query.status = req.query.status;
            }

            const cursor = booksCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });


        // user books detailes
        app.get('/api/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await booksCollection.findOne(query);
            res.send(result)
        });



        // LiBrian All Books Collectioon
        app.get('/api/librarianAllBooks', async (req, res) => {
            const query = {
            }
            if (req.query.addById) {
                query.addById = req.query.addById;
            }
            const cursor = booksCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //book Item Delete
        app.delete("/api/deleteBooks/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await booksCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    return res.status(404).send({
                        success: false,
                        message: "Book not found",
                    });
                }

                res.send({
                    success: true,
                    message: "Book deleted successfully",
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        // Edit Books
        app.patch("/api/editBooks/:id", async (req, res) => {
            const id = req.params.id;

            const updateDoc = {
                $set: req.body,
            };

            const result = await booksCollection.updateOne(
                { _id: new ObjectId(id) },
                updateDoc
            );

            res.send(result);
        });

        // books Status updated
        app.patch("/api/books/status/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;

                console.log("========== STATUS UPDATE ==========");
                console.log("ID:", id);
                console.log("STATUS:", status);

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid ObjectId",
                    });
                }

                const result = await booksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: status,
                        },
                    }
                );

                console.log("MongoDB Result:", result);

                if (result.matchedCount === 0) {
                    return res.status(404).send({
                        success: false,
                        message: "Book not found",
                    });
                }

                res.status(200).send({
                    success: true,
                    message: "Status updated successfully",
                    modifiedCount: result.modifiedCount,
                });

            } catch (error) {
                console.error("STATUS UPDATE ERROR:", error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        //all Librarian List
        app.get('/api/librarianList', async (req, res) => {
            try {
                const query = {};

                // যদি role query না পাঠান, তাহলে default librarian
                query.role = req.query.role || "librarian";

                const result = await usersCollection.find(query).toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        //admin

        //all User List
        app.get('/api/userList', async (req, res) => {
            try {

                const result = await usersCollection.find().toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        //BooksList by admin
        app.get('/api/adminBooksList', async (req, res) => {
            try {
                const result = await booksCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // ‍admin book status update 
        app.patch("/api/books/adminStatus/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid ObjectId",
                    });
                }

                // বর্তমান বই খুঁজে বের করা
                const book = await booksCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!book) {
                    return res.status(404).send({
                        success: false,
                        message: "Book not found",
                    });
                }

                let newStatus = "active";

                if (book.status === "active") {
                    newStatus = "inactive";
                } else if (
                    book.status === "inactive" ||
                    book.status === "Pending Approval"
                ) {
                    newStatus = "active";
                }

                const result = await booksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: newStatus,
                        },
                    }
                );

                res.status(200).send({
                    success: true,
                    message: "Status updated successfully",
                    status: newStatus,
                    modifiedCount: result.modifiedCount,
                });
            } catch (error) {
                console.error(error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        //Books Order 
        app.post ("/api/orderBooks", async (req, res)) => {
            try {
                const orderData = req.body;
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }   
        }




        /// admin


        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error(err);
    }
}

connectToMongoDB();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});