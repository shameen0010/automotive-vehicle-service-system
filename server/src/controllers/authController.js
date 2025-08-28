import Joi from 'joi';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { issueTokens, setAuthCookies, clearAuthCookies } from '../middleware/auth.js';
import { sendMail } from '../utils/email.js';

export async function register(req, res) {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });
  // Use req.body (populated by multer)
  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ message: 'Email already used' });

  // Create user
  const user = await User.create(value);
  // If avatar uploaded, set avatarUrl
  if (req.file) {
    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();
  }
  await AuditLog.create({ actor: user._id, action: 'register' });
  res.status(201).json({ message: 'Registered' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens);
  await AuditLog.create({ actor: user._id, action: 'login' });
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bookingCount: user.bookingCount,
      isLoyaltyEligible: user.isLoyaltyEligible,
      loyaltyDiscountRequested: user.loyaltyDiscountRequested,
      loyaltyDiscountApproved: user.loyaltyDiscountApproved,
      loyaltyDiscountRequestDate: user.loyaltyDiscountRequestDate,
      loyaltyDiscountApprovalDate: user.loyaltyDiscountApprovalDate
    }
  });
}

export async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ ok: true });
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ ok: true });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + (Number(process.env.RESET_OTP_TTL_MIN || 10) * 60000));
  user.resetOTP = { code: otp, expiresAt };
  await user.save();
  await sendMail({ to: email, subject: 'Auto Elite – Reset OTP', text: `OTP: ${otp} (valid ${process.env.RESET_OTP_TTL_MIN}m)` });
  res.json({ ok: true });
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.resetOTP) return res.status(400).json({ message: 'Invalid request' });
  if (user.resetOTP.code !== otp || new Date() > new Date(user.resetOTP.expiresAt))
    return res.status(400).json({ message: 'Invalid/expired OTP' });
  user.password = newPassword;
  user.resetOTP = undefined;
  await user.save();
  await AuditLog.create({ actor: user._id, action: 'password_reset' });
  res.json({ ok: true });
}
