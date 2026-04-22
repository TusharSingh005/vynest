const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const requiredEnv = (value, name) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const firebaseServiceAccount = JSON.parse(
  requiredEnv(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, "FIREBASE_SERVICE_ACCOUNT_JSON")
);

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount)
});

const db = admin.firestore();

// 🔐 CASHFREE KEYS
const CLIENT_ID = requiredEnv(process.env.CASHFREE_CLIENT_ID, "CASHFREE_CLIENT_ID");
const CLIENT_SECRET = requiredEnv(process.env.CASHFREE_CLIENT_SECRET, "CASHFREE_CLIENT_SECRET");

const calculateBookingFee = (propertyType, roomType) => {
  const normalizedPropertyType = (propertyType || "").toLowerCase();
  const normalizedRoomType = (roomType || "").toLowerCase();

  if (normalizedPropertyType === "hostel") {
    return 7000;
  }

  if (normalizedPropertyType === "pg_no_food") {
    return 1000;
  }

  if (normalizedPropertyType === "pg_with_food") {
    return 2000;
  }

  if (normalizedPropertyType === "flat") {
    if (normalizedRoomType.includes("1")) return 3000;
    if (normalizedRoomType.includes("2")) return 4000;
    if (normalizedRoomType.includes("3")) return 5000;
    if (normalizedRoomType.includes("4")) return 5000;
  }

  return null;
};

const isValidDateInput = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
};

// ✅ CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { userId, roomId, moveInDate, occupancyIndex } = req.body;

    const parsedOccupancyIndex = Number.parseInt(occupancyIndex, 10);

    if (
      !req.body ||
      typeof req.body !== "object" ||
      typeof userId !== "string" ||
      !userId.trim() ||
      typeof roomId !== "string" ||
      !roomId.trim() ||
      !isValidDateInput(moveInDate) ||
      Number.isNaN(parsedOccupancyIndex) ||
      parsedOccupancyIndex < 0
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const roomSnap = await db.collection("rooms").doc(roomId).get();

    if (!roomSnap.exists) {
      return res.status(404).json({ error: "Room not found" });
    }

    const roomData = roomSnap.data();
    const selectedRoom = roomData.roomDetails?.[parsedOccupancyIndex];

    if (!selectedRoom) {
      return res.status(400).json({ error: "Invalid room selection" });
    }

    const amount = calculateBookingFee(roomData.propertyType, selectedRoom.type);

    if (!amount) {
      return res.status(400).json({ error: "Unable to calculate booking fee" });
    }

    const orderId = "order_" + Date.now();

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_phone: "+91 70543 64074"
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
      roomPrice: selectedRoom.fee,
      occupancyIndex: String(parsedOccupancyIndex),
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
      const orderId = data?.data?.order?.order_id;

      if (!orderId) return res.sendStatus(200);

      const orderRef = db.collection("orders").doc(orderId);
      const bookingRef = db.collection("bookings").doc(orderId);

      await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists) {
          return;
        }

        const order = orderSnap.data();
        const bookingSnap = await transaction.get(bookingRef);

        if (order.status === "PAID" || bookingSnap.exists) {
          return;
        }

        const roomRef = db.collection("rooms").doc(order.roomId);
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists) {
          return;
        }

        const roomData = roomSnap.data();
        const selectedRoom = roomData.roomDetails?.[Number(order.occupancyIndex)] || {};

        transaction.set(bookingRef, {
          userId: order.userId,
          roomId: order.roomId,
          ownerId: roomData.ownerId || null,
          propertyName: roomData.propertyName || "Property",
          roomType: selectedRoom.type || "Room",
          occupancyIndex: order.occupancyIndex,
          moveInDate: order.moveInDate,
          roomPrice: order.roomPrice,
          bookingAmount: order.amount,
          status: "CONFIRMED",
          orderId,
          createdAt: new Date()
        });

        transaction.update(orderRef, {
          status: "PAID",
          paidAt: new Date()
        });
      });
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get("/verify-payment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderSnap = await db.collection("orders").doc(orderId).get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, status: "NOT_FOUND" });
    }

    const order = orderSnap.data();

    if (order.status === "PAID") {
      return res.json({ success: true, status: "PAID" });
    }

    return res.json({ success: false, status: order.status || "PENDING" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, status: "ERROR" });
  }
});

app.listen(3000, () => console.log("Server running"));
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});
