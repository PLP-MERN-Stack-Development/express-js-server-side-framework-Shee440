import express from "express";
import { v4 as uuidv4 } from "uuid";
import auth from "../middleware/auth.js";
import validateProduct from "../middleware/validateProduct.js";
import NotFoundError from "../errors/NotFoundError.js";
import products from "../data/products.js";

const router = express.Router();

// GET all products
router.get("/", (req, res) => {
  const { category, page = 1, limit = 5, search } = req.query;

  let filtered = products;

  if (category) filtered = filtered.filter(p => p.category === category);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({ total: filtered.length, page: parseInt(page), products: paginated });
});

// GET product by ID
router.get("/:id", (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError("Product not found"));
  res.json(product);
});

// POST create new product
router.post("/", auth, validateProduct, (req, res) => {
  const newProduct = { id: uuidv4(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update product
router.put("/:id", auth, validateProduct, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError("Product not found"));

  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// DELETE product
router.delete("/:id", auth, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError("Product not found"));

  const deleted = products.splice(index, 1);
  res.json({ message: "Product deleted", product: deleted[0] });
});

export default router;
