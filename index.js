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
        const orderBooksCollection = database.collection("orderBooks");
        const booksReviewCollection = database.collection("booksReview");


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
        app.post("/api/orderBooks", async (req, res) => {
            try {
                const orderDetails = req.body;
                const { bookId, userId } = req.body;

                // Required field validation
                if (!bookId || !userId) {
                    return res.status(400).json({
                        success: false,
                        message: "Book ID and User ID are required.",
                    });
                }

                // একই user একই book আগে order করেছে কিনা
                const alreadyOrdered = await orderBooksCollection.findOne({
                    bookId: bookId,
                    userId: userId,
                });

                if (alreadyOrdered) {
                    return res.status(409).json({
                        success: false,
                        message: "You have already requested this book.",
                    });
                }

                orderDetails.paymentStatus = "pending";
                orderDetails.borrowStatus = "pending_payment";
                orderDetails.createdAt = new Date();

                const result = await orderBooksCollection.insertOne(orderDetails);

                res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });

            } catch (error) {
                console.error("Order book error:", error);

                res.status(500).json({
                    success: false,
                    message: "Failed to create borrow request.",
                });
            }
        });

        //Books Order Find One 
        app.get("/api/orderBooks/:id", async (req, res) => {
            try {
                const { id } = req.params;

                console.log("Order ID:", id);

                const order = await orderBooksCollection.findOne({
                    _id: new ObjectId(id),
                });

                console.log(order);

                res.json(order);
            } catch (error) {
                console.error("GET Order Error:", error);

                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
        //update order Data
        app.patch("/api/orderBooks/:id", async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;

            const result = await orderBooksCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: updatedData,
                }
            );

            res.send({
                success: result.modifiedCount > 0,
                modifiedCount: result.modifiedCount,
            });
        });

        //user alrady orde rChake
        // Check user already ordered this book
        app.get("/api/checkAlreadyOrdered", async (req, res) => {
            try {
                const { userId, bookId } = req.query;

                console.log("Checking order:", {
                    userId,
                    bookId,
                });

                if (!userId || !bookId) {
                    return res.status(400).json({
                        success: false,
                        alreadyOrdered: false,
                        message: "userId and bookId are required.",
                    });
                }

                const existingOrder = await orderBooksCollection.findOne({
                    userId: userId,
                    bookId: bookId,
                });

                if (existingOrder) {
                    return res.status(200).json({
                        success: true,
                        alreadyOrdered: true,
                        order: existingOrder,
                    });
                }

                return res.status(200).json({
                    success: true,
                    alreadyOrdered: false,
                    order: null,
                });

            } catch (error) {
                console.error(
                    "checkAlreadyOrdered error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    alreadyOrdered: false,
                    message: "Internal server error.",
                });
            }
        });

        //user Order list
        app.get("/api/userOrders/:userId", async (req, res) => {
            try {
                const { userId } = req.params;

                const orders = await orderBooksCollection
                    .find({ userId })
                    .toArray();

                res.send(orders);
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });

        //librarian Order list

        app.get("/api/librarianOrders/:librarianId", async (req, res) => {
            try {
                const { librarianId } = req.params;

                console.log("Param:", librarianId);

                const orders = await orderBooksCollection
                    .find({ libraryId: librarianId })
                    .toArray();

                console.log("Orders:", orders);

                res.send(orders);
            } catch (error) {
                console.error(error);
            }
        });

        // books order Status Change borrowStatus
        app.patch("/api/orderBooksStatus/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { borrowStatus } = req.body;

                const result = await orderBooksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: { borrowStatus },
                    }
                );

                res.status(200).json({
                    success: true,
                    message: "Borrow status updated successfully.",
                    result,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Internal server error.",
                });
            }
        });

        //বুক রিভিউ
        app.post("/api/booksReview", async (req, res) => {
            try {
                const reviewData = req.body;

                const alreadyReviewed = await booksReviewCollection.findOne({
                    orderId: reviewData.orderId,
                });

                if (alreadyReviewed) {
                    return res.status(400).json({
                        success: false,
                        message: "You have already submitted a review for this order.",
                    });
                }

                const result = await booksReviewCollection.insertOne(reviewData);

                res.status(201).json({
                    success: true,
                    message: "Review submitted successfully.",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Internal server error.",
                });
            }
        });

        // review Cheek
        app.get("/api/booksReview/check/:orderId", async (req, res) => {
            try {
                const { orderId } = req.params;

                const review = await booksReviewCollection.findOne({ orderId });

                res.json({
                    success: true,
                    reviewed: !!review,
                    review: review || null // 👈 এখানে review ডাটাটি পাঠাতে হবে
                });
            } catch (error) {
                console.error("Error checking review:", error);

                res.status(500).json({
                    success: false,
                    message: "Internal server error.",
                });
            }
        });


        //User Summery
        // ==========================================
        // User Complete Activity Summary
        // GET /api/userSummary/:userId
        // ==========================================
        app.get("/api/userSummary/:userId", async (req, res) => {
            try {
                const { userId } = req.params;

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        message: "User ID is required.",
                    });
                }

                // ------------------------------------------
                // 1. Find User
                // ------------------------------------------
                const user = await usersCollection.findOne(
                    {
                        $or: [
                            { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null },
                            { id: userId },
                        ],
                    },
                    {
                        projection: {
                            password: 0,
                            confirmPassword: 0,
                        },
                    }
                );

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found.",
                    });
                }

                // ------------------------------------------
                // 2. Get User Orders
                // ------------------------------------------
                const orders = await orderBooksCollection
                    .find({ userId: userId })
                    .sort({ createdAt: -1 })
                    .toArray();

                // ------------------------------------------
                // 3. Basic Order Statistics
                // ------------------------------------------

                const totalOrders = orders.length;

                const pendingOrders = orders.filter((order) => {
                    const status = String(order.borrowStatus || "").toLowerCase();

                    return [
                        "pending",
                        "pending_payment",
                        "pending approval",
                        "processing",
                        "approved",
                    ].includes(status);
                }).length;

                const completedOrders = orders.filter((order) => {
                    const status = String(order.borrowStatus || "").toLowerCase();

                    return [
                        "completed",
                        "delivered",
                        "returned",
                        "finished",
                    ].includes(status);
                }).length;

                const canceledOrders = orders.filter((order) => {
                    const status = String(order.borrowStatus || "").toLowerCase();

                    return [
                        "cancelled",
                        "canceled",
                        "rejected",
                    ].includes(status);
                }).length;

                // ------------------------------------------
                // 4. Payment Statistics
                // ------------------------------------------

                const paidOrders = orders.filter(
                    (order) =>
                        String(order.paymentStatus || "").toLowerCase() === "paid"
                );

                const totalSpent = paidOrders.reduce((total, order) => {
                    const amount = Number(order.booksPrice) || 0;

                    return total + amount;
                }, 0);

                // ------------------------------------------
                // 5. Monthly Spending
                // ------------------------------------------

                const monthlySpendingMap = {};

                paidOrders.forEach((order) => {
                    if (!order.createdAt) return;

                    const date = new Date(order.createdAt);

                    if (Number.isNaN(date.getTime())) return;

                    const month = date.toLocaleString("en-US", {
                        month: "short",
                    });

                    const year = date.getFullYear();

                    const key = `${year}-${date.getMonth()}`;

                    const amount = Number(order.booksPrice) || 0;

                    if (!monthlySpendingMap[key]) {
                        monthlySpendingMap[key] = {
                            month,
                            year,
                            amount: 0,
                        };
                    }

                    monthlySpendingMap[key].amount += amount;
                });

                const monthlySpending = Object.values(monthlySpendingMap)
                    .sort((a, b) => {
                        if (a.year !== b.year) {
                            return a.year - b.year;
                        }

                        return (
                            new Date(`${a.month} 1, ${a.year}`).getMonth() -
                            new Date(`${b.month} 1, ${b.year}`).getMonth()
                        );
                    })
                    .map((item) => ({
                        month: item.month,
                        year: item.year,
                        amount: item.amount,
                    }));

                // ------------------------------------------
                // 6. Monthly Books Ordered
                // ------------------------------------------

                const monthlyBooksMap = {};

                orders.forEach((order) => {
                    if (!order.createdAt) return;

                    const date = new Date(order.createdAt);

                    if (Number.isNaN(date.getTime())) return;

                    const month = date.toLocaleString("en-US", {
                        month: "short",
                    });

                    const year = date.getFullYear();

                    const key = `${year}-${date.getMonth()}`;

                    if (!monthlyBooksMap[key]) {
                        monthlyBooksMap[key] = {
                            month,
                            year,
                            books: 0,
                        };
                    }

                    monthlyBooksMap[key].books += 1;
                });

                const monthlyBooks = Object.values(monthlyBooksMap)
                    .sort((a, b) => {
                        if (a.year !== b.year) {
                            return a.year - b.year;
                        }

                        return (
                            new Date(`${a.month} 1, ${a.year}`).getMonth() -
                            new Date(`${b.month} 1, ${b.year}`).getMonth()
                        );
                    })
                    .map((item) => ({
                        month: item.month,
                        year: item.year,
                        books: item.books,
                    }));

                // ------------------------------------------
                // 7. Get User Reviews
                // ------------------------------------------
                const reviews = await booksReviewCollection
                    .find({
                        $or: [
                            { userId: userId },
                            { reviewerId: userId },
                        ],
                    })
                    .sort({ createdAt: -1 })
                    .toArray();

                // ------------------------------------------
                // 8. Delivery Statistics
                // ------------------------------------------

                const deliveredOrders = orders.filter((order) => {
                    const status = String(order.borrowStatus || "").toLowerCase();

                    return ["delivered", "completed"].includes(status);
                }).length;

                const totalForDelivery = orders.length;

                const deliveryPercentage =
                    totalForDelivery > 0
                        ? Math.round(
                            (deliveredOrders / totalForDelivery) * 100
                        )
                        : 0;

                const pendingPercentage =
                    totalForDelivery > 0
                        ? Math.round(
                            (pendingOrders / totalForDelivery) * 100
                        )
                        : 0;

                const canceledPercentage =
                    totalForDelivery > 0
                        ? Math.round(
                            (canceledOrders / totalForDelivery) * 100
                        )
                        : 0;

                // ------------------------------------------
                // 9. Book Statistics
                // ------------------------------------------

                const uniqueBookIds = [
                    ...new Set(
                        orders
                            .map((order) => order.bookId)
                            .filter(Boolean)
                            .map(String)
                    ),
                ];

                // ------------------------------------------
                // 10. Get Ordered Books
                // ------------------------------------------

                let orderedBooks = [];

                if (uniqueBookIds.length > 0) {
                    const objectIds = uniqueBookIds
                        .filter((id) => ObjectId.isValid(id))
                        .map((id) => new ObjectId(id));

                    orderedBooks = await booksCollection
                        .find({
                            $or: [
                                {
                                    _id: {
                                        $in: objectIds,
                                    },
                                },
                                {
                                    _id: {
                                        $in: uniqueBookIds,
                                    },
                                },
                            ],
                        })
                        .toArray();
                }

                // ------------------------------------------
                // 11. Final Response
                // ------------------------------------------

                return res.status(200).json({
                    success: true,

                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || null,
                        photo: user.photo || user.image || null,
                        role: user.role || "user",
                    },

                    stats: {
                        totalOrders,
                        pendingOrders,
                        completedOrders,
                        canceledOrders,

                        totalSpent,

                        totalReviews: reviews.length,

                        totalBooks: uniqueBookIds.length,
                    },

                    books: {
                        totalOrdered: totalOrders,
                        uniqueBooks: uniqueBookIds.length,
                        completed: completedOrders,
                        pending: pendingOrders,
                        canceled: canceledOrders,
                    },

                    spending: {
                        total: totalSpent,
                        paidOrders: paidOrders.length,
                        monthly: monthlySpending,
                    },

                    readingActivity: {
                        monthly: monthlyBooks,
                    },

                    delivery: {
                        total: totalForDelivery,
                        delivered: deliveredOrders,
                        pending: pendingOrders,
                        canceled: canceledOrders,

                        percentage: {
                            delivered: deliveryPercentage,
                            pending: pendingPercentage,
                            canceled: canceledPercentage,
                        },
                    },

                    orders,

                    books: orderedBooks,

                    reviews,
                });
            } catch (error) {
                console.error("User Summary Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load user summary.",
                    error: error.message,
                });
            }
        });



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