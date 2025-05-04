import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Declare the global namespace to match routes.ts
declare global {
  var authTokens: Map<string, number>;
}

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
  console.log("Setting up auth with in-memory session store (no external storage)");
  
  // Don't use any external store - just use in-memory session
  const sessionSettings: session.SessionOptions = {
    secret: 'viralbite-emergency-fix-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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

  // Basic session testing endpoint - creates and accesses the session
  app.get("/api/session-test", (req, res) => {
    // Set a session value
    if (!req.session.testValue) {
      req.session.testValue = new Date().toISOString();
      console.log("🔶 NEW TEST VALUE CREATED:", req.session.testValue);
    } else {
      console.log("🔶 EXISTING TEST VALUE:", req.session.testValue);
    }
    
    return res.json({
      sessionID: req.sessionID,
      testValue: req.session.testValue,
      cookies: req.headers.cookie
    });
  });

  // Generate an authentication token for emergency use
  app.post("/api/auth/token", (req, res) => {
    console.log("Token auth request received for username:", req.body.username);
    
    // Use a simpler login flow without session regeneration
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Token auth error:", err);
        return res.status(500).send("Internal Server Error");
      }
      
      if (!user) {
        console.log("Token auth failed: Invalid credentials");
        return res.status(401).send("Invalid credentials");
      }
      
      // Generate a unique token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Store the token with the user ID in the token map in routes.ts
      if (typeof global.authTokens !== 'undefined') {
        global.authTokens.set(token, user.id);
        console.log("Token generated for user:", user.id, user.username);
      } else {
        console.error("authTokens map not available globally");
      }
      
      // Create a safe user object without the password
      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      };
      
      // Send the token to the client
      return res.status(200).json({
        token,
        user: safeUser
      });
    })(req, res, () => {});
  });
  
  // Dummy authenticated test endpoint - allows skip of authentication with a special header
  app.get("/api/force-auth", (req, res) => {
    if (req.headers['x-viralbite-auth-bypass'] === 'true') {
      req.login({id: 1, username: 'emergency-bypass'} as any, (err) => {
        if (err) {
          console.error("Emergency auth bypass error:", err);
          return res.status(500).send("Error forcing authentication");
        }
        return res.json({success: true, sessionID: req.sessionID});
      });
    } else {
      return res.json({success: false, message: "Missing auth bypass header"});
    }
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - Is Authenticated:", req.isAuthenticated());
    console.log("GET /api/user - Cookies:", req.headers.cookie);
    console.log("GET /api/user - All Headers:", JSON.stringify(req.headers));
    
    // Helper function to create a safe user object
    const createSafeUserObject = (user: any) => {
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      };
    };
    
    // Check for token in header for alternative authentication
    const authToken = req.headers['x-auth-token'] as string;
    if (authToken && typeof global.authTokens !== 'undefined' && global.authTokens.has(authToken)) {
      const userId = global.authTokens.get(authToken);
      console.log("GET /api/user - Token auth detected - User ID:", userId);
      
      if (typeof userId === 'undefined') {
        console.error("GET /api/user - Token exists but userId is undefined");
        return res.sendStatus(401);
      }
      
      // Fetch the user by ID
      storage.getUser(userId).then(user => {
        if (user) {
          console.log("GET /api/user - Token user found:", user.id, user.username);
          const safeUser = createSafeUserObject(user);
          return res.json(safeUser);
        } else {
          console.log("GET /api/user - Token auth, but user not found");
          return res.sendStatus(401);
        }
      }).catch(err => {
        console.error("GET /api/user - Token auth error:", err);
        return res.status(500).send("Server error");
      });
      
      return;
    }
    
    if (req.isAuthenticated()) {
      console.log("GET /api/user - User:", req.user.id, req.user.username);
      const safeUser = createSafeUserObject(req.user);
      return res.json(safeUser);
    } else {
      console.log("GET /api/user - Not authenticated");
      return res.sendStatus(401);
    }
  });
}
