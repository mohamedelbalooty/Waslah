import { Router } from "express";

export const healthRouter = Router();

const gateProofTypeMismatch: number = "deliberate type error";

void gateProofTypeMismatch;

healthRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

