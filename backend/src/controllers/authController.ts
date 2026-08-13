import { Request, Response } from "express";
import AuthService from "../services/authService.js";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 400 ? "Bad Request" : status === 409 ? "Conflict" : "Internal Server Error",
        message: error.message || "An unexpected error occurred during registration.",
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 401 ? "Unauthorized" : status === 400 ? "Bad Request" : "Internal Server Error",
        message: error.message || "An unexpected error occurred during login.",
      });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
        return;
      }
      const user = await AuthService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch user profile.",
      });
    }
  }
}

export default AuthController;
