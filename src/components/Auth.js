// src/components/Auth.js
import React, { useState } from "react";
import supabase from "../supabaseClient";

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  // Validate phone number format
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (!/^[6-9]/.test(cleaned)) {
      return "Phone number must start with 6, 7, 8, or 9";
    }
    
    return null;
  };

  // Check if phone already exists
  const checkPhoneExists = async (phone) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("phone")
      .eq("phone", phone)
      .maybeSingle();
    
    return data !== null;
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    const { data, error } = await supabase.rpc('check_email_exists', { 
      email_input: email 
    });
    
    // Fallback: try to sign in to check if email exists
    // If we can't use RPC, we'll catch it during signup
    return false;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!form.email) {
        throw new Error("Please enter your email address");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess("Password reset link sent! Check your email inbox.");
      setTimeout(() => {
        setIsForgotPassword(false);
        setIsLogin(true);
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    if (!isLogin) {
      // Validate name
      if (!form.name || form.name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
      }

      // Validate phone format
      const phoneError = validatePhone(form.phone);
      if (phoneError) {
        throw new Error(phoneError);
      }

      // Check if phone already exists
      const phoneExists = await checkPhoneExists(form.phone);
      if (phoneExists) {
        throw new Error("This phone number is already registered. Please use a different number.");
      }

      // Signup
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || 
            error.message.includes("already been registered")) {
          throw new Error("This email is already registered. Please login or use a different email.");
        }
        throw error;
      }

      // SUCCESS: Show message and redirect to login
      setSuccess("✅ Account created successfully! Please login.");
      
      // Clear form
      setForm({
        email: "",
        password: "",
        name: "",
        phone: "",
      });

      // Switch to login view after 2 seconds
      setTimeout(() => {
        setIsLogin(true);
        setSuccess("");
      }, 2000);

      // Don't set user - let them login manually
      // setUser(data.user); // REMOVE THIS LINE

    } else {
      // Login (unchanged)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      setUser(data.user);
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};


  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>🔐 Reset Password</h2>
            <p className="auth-subtitle">
              Enter your email to receive a password reset link
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your registered email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                ✅ {success}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Sending reset link...
                </>
              ) : (
                <>Send Reset Link</>
              )}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              Remember your password?
              <button 
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setError("");
                  setSuccess("");
                }} 
                className="toggle-btn"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup View
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? "Welcome Back! 👋" : "Create Account 🎉"}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? "Login to continue shopping" 
              : "Sign up to start selling"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  title="Enter a valid 10-digit Indian mobile number"
                />
                <small className="input-hint">
                  📱 Must be unique (e.g., 9876543210)
                </small>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
            {!isLogin && (
              <small className="input-hint">
                📧 Must be unique
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            {!isLogin && (
              <small className="input-hint">
                🔒 Minimum 6 characters
              </small>
            )}
          </div>

          {isLogin && (
            <div className="forgot-password-link">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="forgot-btn"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                {isLogin ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              <>{isLogin ? "Login" : "Sign Up"}</>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }} 
              className="toggle-btn"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
