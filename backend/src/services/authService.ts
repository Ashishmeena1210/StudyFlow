import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";
import { generateToken } from "../middleware/authMiddleware.js";

export class AuthService {
  static async register(email: string, password: string, name: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw { status: 400, message: "A valid email address is required." };
    }

    if (!password || password.length < 6) {
      throw { status: 400, message: "Password must be at least 6 characters long." };
    }

    if (!cleanName) {
      throw { status: 400, message: "Name is required." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw { status: 409, message: "An account with this email address already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    return { user, token };
  }

  static async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw { status: 400, message: "Email and password are required." };
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw { status: 401, message: "Invalid email or password." };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw { status: 401, message: "Invalid email or password." };
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { status: 404, message: "User not found." };
    }

    return user;
  }
}

export default AuthService;
