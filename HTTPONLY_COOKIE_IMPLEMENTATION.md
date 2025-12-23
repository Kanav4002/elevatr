# 🍪 HttpOnly Cookie Implementation Guide

## 📋 **Overview**

Your Elevatr project now uses **secure httpOnly cookies** for JWT authentication instead of localStorage. This is a **production-grade security implementation** that protects against XSS attacks.

---

## 🔐 **What Changed?**

### **Before (Insecure - localStorage):**
```
1. Backend sends token in response body
2. Frontend saves token to localStorage
3. Frontend manually adds token to Authorization header
4. ❌ Vulnerable to XSS attacks
```

### **After (Secure - httpOnly Cookie):**
```
1. Backend sends token as httpOnly cookie
2. Browser automatically stores cookie (invisible to JavaScript)
3. Browser automatically sends cookie with every request
4. ✅ Protected from XSS attacks
```

---

## 🎯 **How It Works**

### **1. User Registers/Logs In:**

**Backend (`auth.controller.js`):**
```javascript
// Set httpOnly cookie
res.cookie("token", token, { 
  httpOnly: true,              // ✅ JavaScript cannot access
  maxAge: 24*60*60*1000,       // 24 hours
  secure: true,                // ✅ HTTPS only in production
  sameSite: 'none'             // ✅ Allow cross-origin
});

// Response body (NO TOKEN!)
res.status(200).json({
  message: "Login successful",
  user: { id, name, email, role }
});
```

**Frontend (`LoginPage.jsx`):**
```javascript
const res = await authAPI.login(payload);
login(res.data.user); // Only user data, no token!
```

---

### **2. Making API Requests:**

**Frontend (`api.js`):**
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true  // ✅ Send cookies automatically
});

// No need for Authorization header interceptor!
```

**Backend (`auth.middleware.js`):**
```javascript
const verifyAuth = async (req, res, next) => {
  // Read token from cookie (not Authorization header)
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.user = payload;
  next();
};
```

---

### **3. Logout:**

**Backend (`auth.controller.js`):**
```javascript
const logoutUser = async(req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  
  res.status(200).json({ message: "Logout successful" });
};
```

**Frontend (`AuthContext.jsx`):**
```javascript
const logout = async () => {
  // Call backend to clear cookie
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  // Clear local state
  setUser(null);
  localStorage.removeItem('user');
};
```

---

## 📁 **Files Modified**

### **Backend:**
1. ✅ `server.js` - Added `cookie-parser` middleware
2. ✅ `middlewares/auth.middleware.js` - Read token from cookie
3. ✅ `controllers/auth.controller.js` - Set/clear httpOnly cookie, removed token from response
4. ✅ `routes/auth.route.js` - Added logout endpoint

### **Frontend:**
1. ✅ `services/api.js` - Added `withCredentials: true`, removed token interceptor
2. ✅ `context/AuthContext.jsx` - Removed token state & localStorage
3. ✅ `(Auth)/login/LoginPage.jsx` - Only pass user data, not token

---

## 🧪 **Testing in Browser DevTools**

### **1. Login:**
```
1. Login to your app
2. Open DevTools → Application → Cookies
3. ✅ You should see "token" cookie with:
   - HttpOnly: ✓ (checked)
   - Secure: ✓ (in production)
   - SameSite: None (in production)
```

### **2. Check localStorage:**
```
1. Open DevTools → Application → Local Storage
2. ❌ You should NOT see any "token" key
3. ✅ You should only see "user" object
```

### **3. API Requests:**
```
1. Open DevTools → Network tab
2. Make any API request
3. Check request → Cookies tab
4. ✅ You should see "token" cookie sent automatically
```

### **4. Logout:**
```
1. Logout from your app
2. Check Cookies again
3. ✅ "token" cookie should be gone
```

---

## 🚀 **Deployment Configuration**

### **Environment Variables:**

**Backend (.env):**
```env
NODE_ENV=production
CLIENT_URL=https://elevatr-phi.vercel.app
JWT_SECRET=your-secret-key
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://elevatr-zz9y.onrender.com/api
```

### **Important for Production:**

1. **HTTPS is REQUIRED** - `secure: true` only works with HTTPS
2. **CORS must allow credentials** - Already configured in `server.js`
3. **SameSite=None** - Required for cross-origin (Vercel → Render)

---

## 🎓 **For Your Viva:**

### **Q: Why httpOnly cookies instead of localStorage?**

**Answer:**
> "We use httpOnly cookies for JWT storage because they provide superior security. Unlike localStorage, httpOnly cookies cannot be accessed by JavaScript, which protects our tokens from XSS (Cross-Site Scripting) attacks. Even if malicious JavaScript is injected into our page, it cannot steal the authentication token. The browser automatically handles cookie transmission, reducing client-side complexity while improving security."

### **Q: How does the authentication flow work?**

**Answer:**
> "When a user logs in, the backend creates a JWT containing user details and sets it as an httpOnly cookie in the response. The browser automatically stores this cookie and includes it with every subsequent request to our backend. Our auth middleware extracts the token from `req.cookies`, verifies it using our JWT secret, and attaches the user payload to the request object. This happens automatically without any client-side JavaScript handling the token."

### **Q: What are the cookie settings and why?**

**Answer:**
> "We configure the cookie with three key settings:
> 1. **httpOnly: true** - Prevents JavaScript access, protecting against XSS
> 2. **secure: true** - Ensures cookie is only sent over HTTPS in production
> 3. **sameSite: 'none'** - Allows cross-origin requests between our Vercel frontend and Render backend
> 4. **maxAge: 24 hours** - Automatic expiration for security"

---

## 🔄 **Flow Diagram**

```
┌──────────────┐
│    LOGIN     │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend: authAPI.login(payload)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend: Verify credentials        │
│           Generate JWT              │
│           Set httpOnly cookie       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Browser: Automatically store       │
│           cookie (invisible to JS)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend: Save user data only      │
│            (no token!)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   SUBSEQUENT API REQUESTS           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Browser: Auto-send cookie with     │
│           every request             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend: Extract token from cookie │
│           Verify & authenticate     │
└─────────────────────────────────────┘
```

---

## ✅ **Benefits**

1. **🔒 Enhanced Security** - Protected from XSS attacks
2. **🚀 Automatic Handling** - Browser manages cookies
3. **🧹 Cleaner Code** - No manual token management
4. **📱 Better UX** - Automatic authentication
5. **🏢 Production-Ready** - Industry standard practice

---

## ⚠️ **Important Notes**

1. **Development vs Production:**
   - Local: `sameSite: 'lax'` (same origin)
   - Production: `sameSite: 'none'` + `secure: true` (cross-origin)

2. **CORS Configuration:**
   - Must have `credentials: true` in backend CORS settings
   - Must have `withCredentials: true` in frontend axios config

3. **Testing:**
   - You can only test httpOnly cookies in the browser's Application/Storage tab
   - You CANNOT access them via JavaScript (that's the point!)

4. **Logout:**
   - MUST call backend `/api/auth/logout` to clear cookie
   - Simply removing localStorage is NOT enough

---

## 🎉 **Summary**

Your Elevatr project now implements **enterprise-grade authentication** using httpOnly cookies. This is the same approach used by major companies like Google, Facebook, and GitHub. The token is invisible to your frontend JavaScript, making it impossible for attackers to steal even if they inject malicious code into your page.

**Key Takeaway for Viva:**
> "We prioritized security by implementing httpOnly cookie-based authentication, which is considered a best practice in modern web development. This protects our users' sessions from the most common attack vector - XSS vulnerabilities."

