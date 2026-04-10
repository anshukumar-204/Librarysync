# Implementation Plan - Fix OTP Email Verification

The user reported that student registration OTP and admin login OTP verification are not working. 

## Research Findings
- **Student Registration**: In `src/controllers/auth.controller.ts`, the `register` function sends an OTP but does not `await` the `sendMail` call. It also uses a background dispatch that might fail silently.
- **Admin Login**: The current `login` function in `src/controllers/auth.controller.ts` provides direct access without OTP. However, the compiled `auth.controller.js` and the user's request suggest that an OTP flow IS expected for admins.
- **SMTP Configuration**: Brevo is used. The `SENDER_EMAIL` in `.env` is `sandeep08611@gmail.com`.

## Proposed Changes

### Backend Changes

#### [MODIFY] [auth.controller.ts](file:///c:/Users/sande/Desktop/newdata/new%20data/library-attendance-system/src/controllers/auth.controller.ts)
- Update `sendMail` to be more robust.
- Update `register` to `await sendMail` to ensure the user receives feedback if the email fails.
- Add `preAuthLogin` and `verifyLoginOtp` functions to handle 2FA/OTP login, specifically for administrators (or all users if desired).
- Or, modify the existing `login` to check if OTP is required for the user role.

#### [MODIFY] [auth.routes.ts](file:///c:/Users/sande/Desktop/newdata/new%20data/library-attendance-system/src/routes/auth.routes.ts)
- Add routes for the new OTP login flow: `/pre-auth-login` and `/verify-login-otp`.

### Frontend Changes

#### [MODIFY] [authApi.js](file:///c:/Users/sande/Desktop/newdata/new%20data/library-attendance-system/client/src/services/authApi.js)
- Add `preAuthLogin` and `verifyLoginOtp` to the API service.

#### [MODIFY] [authSlice.js](file:///c:/Users/sande/Desktop/newdata/new%20data/library-attendance-system/client/src/store/slices/authSlice.js)
- Update Redux slice to handle the two-step login process.

#### [MODIFY] [AdminLoginPage.jsx](file:///c:/Users/sande/Desktop/newdata/new%20data/library-attendance-system/client/src/pages/auth/AdminLoginPage.jsx)
- Update the UI to include an OTP verification stage after the initial login attempt.

## Open Questions
- **Should OTP login be enforced for all users (including students) or just for admins?** 
- **Should we use the existing `login` route and return a "requires OTP" flag, or use separate endpoints as suggested in the compiled code (`preAuthLogin`)?**

## Verification Plan

### Automated Tests
- I will simulate registration and login requests using a test script to verify that OTPs are generated and saved in the database.
- I will use the `browser` tool to verify the frontend flow if possible (though email delivery itself is hard to test without a real account).

### Manual Verification
- The user will need to verify that emails are actually arriving in their inbox (sandeep08611@gmail.com).
