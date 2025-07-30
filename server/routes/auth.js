import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  console.log('\n--- INICIO DE INTENTO DE LOGIN ---');
  try {
    const { email, password } = req.body;
    console.log(`[1/4] Petición recibida para email: ${email}`);
    if (!password) {
      console.log('[ERROR] No se recibió contraseña.');
    } else {
      console.log('[INFO] Contraseña recibida (longitud): ', password.length);
    }

    if (!email || !password) {
      console.log('[2/4] Fallo: Email o contraseña no proporcionados.');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`[2/4] Buscando usuario en la base de datos...`);
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`[3/4] Fallo: Usuario con email '${email}' no encontrado.`);
      console.log('--- FIN DE INTENTO DE LOGIN ---\n');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`[3/4] Éxito: Usuario encontrado - ${user.profile.firstName} ${user.profile.lastName}`);
    console.log(`   - Status de la cuenta: ${user.status}`);
    console.log(`   - Password hasheado en DB: ${user.password.substring(0, 15)}...`);

    if (user.status !== 'active') {
      console.log(`[ERROR] La cuenta del usuario no está activa.`);
      return res.status(401).json({ message: 'Account is not active' });
    }

    console.log('[4/4] Comparando contraseña proporcionada con la de la DB...');
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('[ERROR] La contraseña NO es válida.');
      console.log('--- FIN DE INTENTO DE LOGIN ---\n');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('[ÉXITO] La contraseña es VÁLIDA.');

    const token = jwt.sign(
      { userId: user._id, role: user.permissions.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('[INFO] Token JWT generado.');

    user.session.isActive = true;
    user.session.lastLogin = new Date();
    await user.save();
    console.log('[INFO] Sesión de usuario actualizada en la DB.');

    console.log('--- LOGIN EXITOSO ---\n');
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('\n[ERROR FATAL] Ocurrió un error en el servidor durante el login:', error);
    console.log('--- FIN DE INTENTO DE LOGIN ---\n');
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.session.isActive = false;
    await user.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.permissions.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

export default router;