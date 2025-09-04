import bcrypt from "bcryptjs";
import { User, IUser } from "../models/user.model";
import connectMongoDB from "../mongodb";

/**
 * Authentication Service
 * Handles user registration, login, and authentication logic
 */
export class AuthService {
  /**
   * Initialize database connection
   */
  private static async init() {
    await connectMongoDB();
  }

  /**
   * Register a new user with email and password
   */
  static async registerUser(data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }): Promise<IUser> {
    await this.init();

    // Check if user already exists
    const existingUser = await User.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check username availability if provided
    if (data.username) {
      const usernameExists = await User.findByUsername(data.username);
      if (usernameExists) {
        throw new Error("Username is already taken");
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create the user
    const user = new User({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      username: data.username,
      // Mark as verified because OTP step was completed before registration
      emailVerified: new Date(),
      isOnboarded: false,
    });

    await user.save();
    return user;
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(
    email: string,
    password: string
  ): Promise<IUser | null> {
    await this.init();

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if user has a password (credential-based auth)
    if (!user.password) {
      throw new Error("Please sign in with your social account");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    await this.init();

    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  /**
   * Update user's password
   */
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    await this.init();

    const user = await User.findById(userId);
    if (!user || !user.password) {
      throw new Error("User not found or does not have a password");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return true;
  }

  /**
   * Create or update OAuth user
   */
  static async syncOAuthUser(data: {
    email: string;
    provider: string;
    providerId: string;
    displayName?: string;
    avatar?: string;
  }): Promise<IUser> {
    await this.init();

    // Try to find existing user
    let user = await User.findByEmail(data.email);

    if (user) {
      // Update OAuth info if needed
      if (!user.provider) {
        user.provider = data.provider;
        user.providerId = data.providerId;
      }
      if (!user.avatar && data.avatar) {
        user.avatar = data.avatar;
      }
      await user.save();
    } else {
      // Create new OAuth user
      user = new User({
        email: data.email.toLowerCase(),
        provider: data.provider,
        providerId: data.providerId,
        displayName: data.displayName,
        avatar: data.avatar,
        isOnboarded: false,
        emailVerified: new Date(), // OAuth users are pre-verified
      });
      await user.save();
    }

    return user;
  }

  /**
   * Mark email as verified
   */
  static async verifyEmail(userId: string): Promise<boolean> {
    await this.init();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.emailVerified = new Date();
    await user.save();

    return true;
  }

  /**
   * Check if user has completed onboarding
   */
  static async checkOnboardingStatus(userId: string): Promise<boolean> {
    await this.init();

    const user = await User.findById(userId);
    return user?.isOnboarded || false;
  }
}
