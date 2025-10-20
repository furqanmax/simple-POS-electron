# 🔑 Sample License Test Values - Quick Reference

## Copy & Paste Ready Values

### 1️⃣ Environment Configuration (.env file)
```env
# Copy these exact values to your .env file
NUVANA_LICENSE_URL=https://licensing.nuvanasolutions.in
NUVANA_PRODUCT_CODE=SIM-POS
NUVANA_SECRET=sk_test_4eC39HqLyjWDarjtT1zdp7dc8hY5kL9mNpQrStUvWxXz
NUVANA_PUBLIC_KEY=base64:MCowBQYDK2VwAyEAH+qM6N8Y7pMQzRhT6Xn5fUjK2xkJFDn4L8kPz7RbqX8=
```

### 2️⃣ Sample License Keys (Actual Nuvana Format)

#### **Real Format Example** (From Nuvana)
```
SIM-POS-ZWGA-N6T4-LVPT-VLV3-C68A
```
- Product code prefix: `SIM-POS`
- Segments: 4-character alphanumeric blocks
- Format: `[PRODUCT]-[SEG1]-[SEG2]-[SEG3]-[SEG4]-[SEG5]`

#### **Test Keys for Different Plans**

**Annual Plan** (All features)
```
SIM-POS-ANN1-2024-FULL-TEST-KEY1
```
- ✅ Unlimited users
- ✅ Unlimited orders  
- ✅ All features enabled
- ✅ Phone + Email support
- 📅 Valid for 365 days

**Monthly Plan**
```
SIM-POS-MTH1-2024-STND-TEST-KEY2
```
- 👥 5 users max
- 📦 1000 orders max
- ✅ Export enabled
- 📧 Email support only
- 📅 Valid for 30 days

**Trial License** (Auto-generated)
```
SIM-POS-TRIAL-AUTO-GEN-TEST-KEY3
```
- 👥 2 users max
- 📦 100 orders max
- ❌ No export
- ❌ No support
- 📅 30 days

### 3️⃣ Test Customer Information
```json
{
  "customer_name": "Test Company Ltd",
  "customer_email": "test@example.com",
  "company": "SimplePOS Testing",
  "phone": "+1-555-0123"
}
```

### 4️⃣ Quick Test Steps

1. **Setup Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   # Add the values from section 1 above
   ```

2. **Start Application**
   ```bash
   npm run build
   npm start
   ```

3. **Activate License**
   - Go to: **Settings** → **License Management**
   - Click: **Activate License**
   - Paste: `SIM-POS-ZWGA-N6T4-LVPT-VLV3-C68A`
   - Click: **Activate**

### 5️⃣ Expected Results

When using the sample license key above, you should see:

```
✅ Status: VALID
📋 Plan: Annual
📅 Days Remaining: 365
👥 Max Users: Unlimited
📦 Max Orders: Unlimited
✓ Export Data: Enabled
✓ Multiple Templates: Enabled
✓ Advanced Reports: Enabled
✓ Support: Phone + Email
```

### 6️⃣ Testing Different Scenarios

| Scenario | License Key to Use | Expected Result |
|----------|-------------------|-----------------|
| **Valid License** | Use annual key above | ✅ Activation successful |
| **Invalid Key** | `INVALID-KEY-12345` | ❌ "Invalid license key" |
| **Short Key** | `ABC123` | ❌ "License key too short" |
| **Empty Key** | Leave blank | ❌ "Please enter a license key" |
| **Expired Trial** | Wait 30 days or change date | ⏰ "Trial expired" |
| **Max Activations** | Activate on 4+ devices | ❌ "Maximum activations reached" |

### 7️⃣ API Testing Commands

```bash
# Test the sample license directly
node test-sample-license.js

# Test with actual Nuvana API (requires valid credentials)
export NUVANA_SECRET=sk_test_4eC39HqLyjWDarjtT1zdp7dc8hY5kL9mNpQrStUvWxXz
export NUVANA_PRODUCT_CODE=TEST-SIMPLEPOS-2024
node test-nuvana-license.js
```

### 8️⃣ Troubleshooting

#### License Not Activating?
1. Check `.env` file has correct values
2. Verify internet connection
3. Check console for error messages
4. Try the Test API Connection button

#### Getting "Network Error"?
- The API endpoint might be down
- Check firewall settings
- Try: `curl https://licensing.nuvanasolutions.in`

#### Database Issues?
```bash
# Reset database (removes all data!)
rm ~/.config/simple-pos-electron/pos.db
npm start  # Will recreate database
```

---

## ⚠️ Important Notes

1. **These are SAMPLE values** for testing only
2. **Real license keys** must be purchased from [Nuvana](https://licensing.nuvanasolutions.in)
3. **Never share** your production `NUVANA_SECRET` key
4. **Format**: License keys follow pattern `NUV-[PLAN]-[SEGMENTS]-[YEAR]`
5. **Security**: Real keys are cryptographically signed and verified

## 📞 Need Real License?

1. Visit: https://licensing.nuvanasolutions.in
2. Sign up for an account
3. Create a new product
4. Get your credentials:
   - Product Code
   - Secret Key
   - Public Key
5. Purchase license keys
6. Replace sample values with real ones

---

**Quick Copy Box** - All values in one place:
```
License Key: SIM-POS-ZWGA-N6T4-LVPT-VLV3-C68A
Product Code: SIM-POS
Secret: sk_test_4eC39HqLyjWDarjtT1zdp7dc8hY5kL9mNpQrStUvWxXz
```
