import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Add debugging for session issues
  console.log("Setting up auth with session store:", !!storage.sessionStore);
  
  // Use extremely simple session configuration to avoid issues
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'viralbite-super-secret-key-123',
    resave: true, // Always save session even if unmodified
    saveUninitialized: true, // Save uninitialized sessions
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log("Deserializing user id:", id);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.error("Deserialize failed: User not found for id:", id);
        return done(null, false);
      }
      console.log("Deserialized user:", user.id, user.username);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("Register request received for username:", req.body.username);
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      console.log("Registration failed: Username already exists");
      return res.status(400).send("Username already exists");
    }

    try {
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      console.log("User created successfully:", user.id, user.username);

      // Use simple login without session regeneration
      req.login(user, (err) => {
        if (err) {
          console.error("Login after registration failed:", err);
          return next(err);
        }
        
        console.log("User registered and logged in:", user.id, user.username);
        console.log("Session ID:", req.sessionID);
        console.log("Is authenticated:", req.isAuthenticated());
        
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Error during registration:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);
    
    // Use a simpler login flow without session regeneration
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).send("Invalid credentials");
      }
      
      // Simple login without session regeneration to avoid complications
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        
        console.log("Login successful, user:", user.id, user.username);
        console.log("Session ID:", req.sessionID);
        
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - Is Authenticated:", req.isAuthenticated());
    if (req.isAuthenticated()) {
      console.log("GET /api/user - User:", req.user.id, req.user.username);
      return res.json(req.user);
    } else {
      console.log("GET /api/user - Not authenticated");
      return res.sendStatus(401);
    }
  });
}
