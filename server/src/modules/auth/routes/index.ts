import { Router } from 'express';

export const authRouter = Router();

import { storage } from '../../../../storage';

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body; // email is used as username in frontend likely

  const user = await storage.getUserByUsername(email);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.username,
        name: user.name,
        role: user.role,
      },
      token: user.id, // Using userId as token
    },
    message: 'Login successful',
  });
});

authRouter.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body; // Added role support

  const existingUser = await storage.getUserByUsername(email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const newUser = await storage.createUser({
    username: email,
    password: password,
    name: name,
    role: role || 'customer',
  });

  res.json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
      token: newUser.id,
    },
    message: 'Registration successful',
  });
});

authRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const user = await storage.getUser(token);

  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

export default authRouter;
