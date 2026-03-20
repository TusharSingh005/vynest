const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 FIREBASE ADMIN
const serviceAccount = require("./serviceAccountKey.json"); // put file in root

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔐 CASHFREE KEYS
const CLIENT_ID = "11956334df025c191586fd794b13365911";
const CLIENT_SECRET = "cfsk_ma_prod_581a6cbc064f6c2b2214fa5d8d589b46_2f768c0b";

// ✅ CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { userId, roomId, amount, moveInDate, roomPrice, occupancyIndex } = req.body;

    const orderId = "order_" + Date.now();

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_phone: "9999999999"
        }
      },
      {
        headers: {
          "x-client-id": CLIENT_ID,
          "x-client-secret": CLIENT_SECRET,
          "x-api-version": "2022-09-01"
        }
      }
    );

    await db.collection("orders").doc(orderId).set({
      userId,
      roomId,
      amount,
      moveInDate,
      roomPrice,
      occupancyIndex,
      status: "PENDING"
    });

    res.json({
      payment_session_id: response.data.payment_session_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

// ✅ WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

   if (data.type === "PAYMENT_SUCCESS") {

      const orderId = data.data.order.order_id;

      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) return res.sendStatus(200);

      const order = orderSnap.data();

      await db.collection("bookings").add({
        userId: order.userId,
        roomId: order.roomId,
        occupancyIndex: order.occupancyIndex,
        moveInDate: order.moveInDate,
        roomPrice: order.roomPrice,
        createdAt: new Date()
      });

      await orderRef.update({ status: "PAID" });
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log("Server running"));
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});
