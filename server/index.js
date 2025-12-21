import express from "express";
import multer from "multer";
import * as tf from "@tensorflow/tfjs-node";
import cors from "cors";
import path from "path";

const app = express();
const upload = multer();
app.use(cors());

// Load ASL model
let model;
(async () => {
  model = await tf.loadLayersModel("file://model/asl_model/model.json");
  console.log("Model loaded!");
})();

// POST /api/asl/classify
app.post("/api/asl/classify", upload.single("image"), async (req, res) => {
  try {
    if (!model) return res.json({ error: "Model not loaded" });

    const imgBuffer = req.file.buffer;

    const img = tf.node
      .decodeImage(imgBuffer, 3)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat()
      .div(255);

    const pred = model.predict(img);
    const index = pred.argMax(1).dataSync()[0];

    const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index];

    return res.json({ letter });
  } catch (err) {
    console.error(err);
    return res.json({ error: "Processing failed" });
  }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
