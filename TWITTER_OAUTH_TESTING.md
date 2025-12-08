# Testing Twitter OAuth Functionality - UI Guide

## Prerequisites
- Production site: https://tasks.epowex.com
- MetaMask or compatible Web3 wallet installed
- Twitter/X account for testing
- Base Network configured in your wallet

## Test Scenario 1: First-Time User Flow

### Step 1: Connect Wallet
1. Navigate to https://tasks.epowex.com
2. Click "Connect Wallet" button in the header
3. Select your wallet (MetaMask, Coinbase Wallet, etc.)
4. Approve the connection request
5. ✅ **Expected**: Wallet address displayed in header

### Step 2: Browse Tasks
1. Click "Tasks" in navigation menu
2. View list of active campaigns
3. Click on any task card to see details
4. Click "Submit Task" button
5. ✅ **Expected**: Task submission modal opens

### Step 3: Twitter OAuth Prompt
1. In the task submission modal, you'll see:
   - 𝕏 icon with "Connect X/Twitter" section
   - Message: "Required to verify task completion"
   - Blue "Connect X/Twitter Account" button
2. ✅ **Expected**: Cannot submit task without connecting Twitter

### Step 4: Connect Twitter Account
1. Click "Connect X/Twitter Account" button
2. ✅ **Expected**: Redirected to Twitter OAuth page (twitter.com/oauth)
3. On Twitter OAuth page:
   - Review permissions requested
   - Click "Authorize app"
4. ✅ **Expected**: Redirected back to tasks.epowex.com
5. ✅ **Expected**: Green success toast notification: "X/Twitter account connected successfully!"
6. ✅ **Expected**: Modal now shows:
   ```
   Connected X/Twitter Account
   @your_twitter_handle
   [Disconnect button]
   ✓ You can now submit tasks with this account
   ```

### Step 5: Submit a Task
1. Complete the actual Twitter task (like, follow, retweet, or comment)
2. In the submission modal:
   - Your Twitter username is pre-filled (read-only)
   - Message shows: "We verify instantly with your verified X account (@your_username)"
3. Click "Submit Task" button
4. ✅ **Expected**: Loading state shows "Verifying..."
5. ✅ **Expected**: One of two outcomes:

   **Success:**
   - Green toast: "Task verified and submitted successfully!"
   - Rewards automatically sent to your wallet
   - Modal closes

   **Failure:**
   - Red toast with error message explaining why verification failed
   - Common reasons: Task not completed, wrong account, task already submitted

## Test Scenario 2: Returning User Flow

### Step 1: Connect Wallet
1. Visit https://tasks.epowex.com
2. Connect the same wallet you used before
3. ✅ **Expected**: Wallet connects immediately

### Step 2: Open Task Submission
1. Navigate to a task and click "Submit Task"
2. ✅ **Expected**: Modal shows you're already connected:
   ```
   Connected X/Twitter Account
   @your_twitter_handle
   ```
3. ✅ **Expected**: Can submit task immediately without re-authenticating

## Test Scenario 3: Disconnect Flow

### Step 1: View Connected Account
1. Connect wallet
2. Open any task submission modal
3. ✅ **Expected**: See your connected Twitter account

### Step 2: Disconnect Twitter
1. Click "Disconnect" button (red button next to username)
2. ✅ **Expected**: 
   - Button shows "Disconnecting..." briefly
   - Green toast: "X/Twitter account disconnected"
   - View returns to "Connect X/Twitter Account" prompt

### Step 3: Verify Disconnect
1. Close and reopen task modal
2. ✅ **Expected**: Twitter connection prompt shown again
3. ✅ **Expected**: Cannot submit tasks until reconnecting

## Test Scenario 4: Multi-Wallet Testing

### Step 1: Connect First Wallet
1. Connect Wallet A
2. Authenticate Twitter with handle @user1
3. ✅ **Expected**: Wallet A linked to @user1

### Step 2: Switch Wallet
1. Disconnect Wallet A in MetaMask
2. Connect Wallet B
3. Open task submission modal
4. ✅ **Expected**: Shows "Connect X/Twitter Account" (no Twitter connected)

### Step 3: Connect Different Twitter Account
1. Click "Connect X/Twitter Account"
2. If still logged into Twitter, you may need to log out first
3. Authenticate with different Twitter account @user2
4. ✅ **Expected**: Wallet B now linked to @user2

### Step 4: Switch Back to Wallet A
1. Switch back to Wallet A in MetaMask
2. Open task submission modal
3. ✅ **Expected**: Shows @user1 (original connection persists)

## Test Scenario 5: Error Handling

### Test 5.1: Submit Without Connecting Wallet
1. Visit site without connecting wallet
2. Try to access tasks
3. ✅ **Expected**: Prompted to connect wallet first

### Test 5.2: OAuth Cancellation
1. Connect wallet
2. Click "Connect X/Twitter Account"
3. On Twitter OAuth page, click "Cancel" instead of "Authorize"
4. ✅ **Expected**: Redirected back to site
5. ✅ **Expected**: Red toast: "Failed to connect X/Twitter account"

### Test 5.3: Submit Wrong Username
1. Complete task with Twitter account @user1
2. Try to submit with verified account @user2
3. ✅ **Expected**: Backend rejects with error (not allowed)

### Test 5.4: Submit Without Completing Task
1. Connect Twitter account
2. Submit task WITHOUT actually completing it (e.g., don't like the tweet)
3. ✅ **Expected**: 
   - Backend verification fails
   - Red toast: "Task verification failed - please complete the task first"

### Test 5.5: Duplicate Submission
1. Submit a task successfully
2. Try to submit the same task again
3. ✅ **Expected**: Error message about duplicate submission

## Test Scenario 6: Different Task Types

### Like Task
1. Find a "Like" campaign
2. Connect Twitter
3. Submit task
4. ✅ **Expected**: Backend calls Twitter API to verify you liked the tweet

### Follow Task
1. Find a "Follow" campaign
2. Connect Twitter
3. Submit task
4. ✅ **Expected**: Backend verifies you follow the target account

### Retweet Task
1. Find a "Retweet" campaign
2. Connect Twitter
3. Submit task
4. ✅ **Expected**: Backend verifies you retweeted the target tweet

### Comment Task
1. Find a "Comment" campaign
2. Connect Twitter
3. Submit task
4. ✅ **Expected**: Backend verifies you commented on the target tweet

## API Testing (Developer Tools)

### Check Twitter Status
Open browser console and run:
```javascript
// Check if wallet is connected to Twitter
fetch('https://api.epowex.com/api/twitter/status/YOUR_WALLET_ADDRESS')
  .then(r => r.json())
  .then(console.log)

// Expected response (not connected):
// { success: true, connected: false, twitterUsername: null }

// Expected response (connected):
// { success: true, connected: true, twitterUsername: "yourhandle" }
```

### Monitor Network Requests
1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Filter by "Fetch/XHR"
4. Click "Connect X/Twitter Account"
5. ✅ **Expected sequence**:
   - POST to `/api/twitter/connect/start`
   - Redirect to `twitter.com/oauth/authorize`
   - Redirect back to `/api/twitter/callback`
   - Redirect to `tasks.epowex.com?twitter_connected=true`
   - GET to `/api/twitter/status/:address`

## Visual Indicators to Look For

### 1. TwitterConnect Component States

**Not Connected:**
- Gray 𝕏 icon
- "Connect X/Twitter" heading
- Blue gradient button
- Helper text: "We'll redirect you to X to authorize access"

**Loading:**
- Animated pulsing skeleton loader
- Gray placeholder elements

**Connected:**
- Blue gradient background
- Blue 𝕏 icon (colored)
- Shows @username
- Green checkmark: "You can now submit tasks with this account"
- Red "Disconnect" button

### 2. Task Submission Modal States

**Before Twitter Connection:**
- TwitterConnect component visible
- Username input field disabled or hidden
- Submit button disabled

**After Twitter Connection:**
- Username field pre-filled (read-only)
- Green verification text
- Submit button enabled

**During Submission:**
- Submit button shows "Verifying..." or "Submitting..."
- Button disabled
- Loading spinner visible

**After Success:**
- Modal closes
- Success toast notification
- Task marked as completed

## Common Issues & Troubleshooting

### Issue: "Connect X/Twitter Account" button doesn't work
**Fix:**
- Check browser console for errors
- Verify API_URL in frontend .env.local
- Check backend is running (https://api.epowex.com/health)

### Issue: OAuth redirects to 404
**Fix:**
- Verify TWITTER_CALLBACK_URL in backend .env
- Should be: https://api.epowex.com/api/twitter/callback

### Issue: After OAuth, still shows "Connect X/Twitter Account"
**Fix:**
- Check URL for ?twitter_connected=true parameter
- Open Network tab and verify /api/twitter/status call succeeds
- Verify wallet address matches between OAuth and wallet connection

### Issue: "Task verification failed"
**Fix:**
- Actually complete the task on Twitter first
- Wait a few seconds for Twitter to index the action
- Verify you're using the correct Twitter account

### Issue: Can't submit task with error "Twitter username mismatch"
**Fix:**
- The Twitter account you completed the task with must match your verified account
- Disconnect and reconnect with the correct Twitter account

## Security Testing

### Test 1: Session Persistence
1. Connect Twitter account
2. Close browser completely
3. Reopen browser
4. Connect same wallet
5. ✅ **Expected**: Twitter connection persists (stored in database)

### Test 2: Cross-Account Prevention
1. Connect Wallet A with Twitter @user1
2. Complete task with Twitter @user2
3. Try to submit from Wallet A
4. ✅ **Expected**: Backend rejects submission

### Test 3: Inspect OAuth Tokens
1. Open browser DevTools → Application → Local Storage
2. ✅ **Expected**: No OAuth tokens stored in browser
3. All tokens stored securely in backend database

## Success Criteria

✅ All test scenarios pass  
✅ Twitter OAuth flow completes smoothly  
✅ Task verification works for all task types  
✅ Error messages are clear and helpful  
✅ No console errors  
✅ UI states transition smoothly  
✅ Wallet-Twitter linkage persists across sessions  
✅ Security measures prevent fraud  

## Support

If tests fail, check:
1. Backend logs: `pm2 logs epwx-api`
2. Frontend logs: Browser console
3. Database records: `psql -d epwx_tasks -c "SELECT * FROM users;"`
4. API health: `curl https://api.epowex.com/health`

For issues, contact: support@epowex.com
