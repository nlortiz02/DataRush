import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '@/config/dbConfig';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, username } = req.body;

    if (!token || !username) {
      return res.status(400).json({ valid: false, message: 'Token and username are required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY) as { username: string };
      
      // Verificar que el token corresponde al usuario
      if (decoded.username !== username) {
        return res.status(401).json({ valid: false, message: 'Invalid token for user' });
      }

      return res.status(200).json({ valid: true });
    } catch (error) {
      return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
}