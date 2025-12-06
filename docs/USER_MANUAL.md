# Shift Handover Log - User Manual

Complete guide to using the Shift Handover Log web application.

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Main Interface](#main-interface)
3. [Creating Log Entries](#creating-log-entries)
4. [Viewing Logs](#viewing-logs)
5. [Editing Log Entries](#editing-log-entries)
6. [Archiving and Restoring](#archiving-and-restoring)
7. [Deleting Log Entries](#deleting-log-entries)
8. [Searching and Filtering](#searching-and-filtering)
9. [Expanded Log View](#expanded-log-view)
10. [Printing Logs](#printing-logs)
11. [Information Slide](#information-slide)
12. [Admin Settings](#admin-settings)
13. [User Login](#user-login)
14. [Tips and Shortcuts](#tips-and-shortcuts)
15. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Access

1. Open your web browser (Chrome, Edge, Firefox, Safari, etc.)
2. Navigate to: **http://localhost:3000** (if running locally) or your configured URL
3. You'll see a login screen:
   - **Username:** Enter your username (default: `admin` or `FO`)
   - **Password:** Enter your password (default: `pass123`)
4. Click **"Login"** to access the application

### Main Screen Overview

When you first open the application, you'll see:

- **Header** at the top with the page name, current time, and admin link
- **Info button (i)** on the left side for permanent information
- **Create New Log** button to add entries
- **Search and Filter** section to find logs
- **Logs table** showing all entries

---

## Main Interface

### Header Section

The header displays:

- **Page Name/Title** - Set by the administrator
- **Current Time** - Updates every second (real-time clock)
- **⚙️ Admin** link - Opens settings (requires admin login)

### Info Button (Left Side)

- Click the **(i) icon** on the left side of the screen
- A slide-out panel appears with permanent information
- This information is set by the administrator
- Click outside the panel or click the (i) again to close

---

## Creating Log Entries

### Step 1: Open the Create Form

1. Click the **"Create New Log"** button at the top of the page
2. A form will appear in a modal window

### Step 2: Fill in the Form

#### Date & Time

- The current date and time is automatically filled
- You can change it by clicking the date/time field
- Select the correct date and time from the calendar picker

#### Short Description

- Enter a brief description (maximum 50 characters)
- Example: "Room 203 AC issue"
- This appears in the main table and serves as a quick reference

#### Note (Detailed Description)

- Enter the full details (maximum 1000 characters)
- Use the **WYSIWYG rich text editor** to format your text - what you see is what you get!
- **Formatting options:**
  - **Bold** (Ctrl+B) - Make text bold
  - *Italic* (Ctrl+I) - Italicize text
  - <u>Underline</u> (Ctrl+U) - Underline text
  - ~~Strikethrough~~ - Cross out text
  - **Highlight** - Highlight text with color (choose from color picker)
  - **Text Color** - Change text color (choose from color picker)
  - **Emoji Selector** - Insert emojis 😀 from categorized emoji picker
  - **Remove Formatting** - Clear all formatting from selected text
- **Creating paragraphs:**
  - Press **Enter** to create a new paragraph
  - Paragraphs are automatically spaced for readability
  - The editor shows paragraphs exactly as they will appear when saved
- **Mentions:**
  - Use **@mentions** like `@user` or `@all` (these will be highlighted in yellow)
  - Note: Email addresses (e.g., `user@example.com`) are automatically excluded from mentions
- **Character count:** Shows at the bottom (e.g., "245/1000 characters")

#### Worker Name

- Enter exactly **3 letters** (A-Z only)
- Example: ABC, XYZ, FO
- The system will convert to uppercase automatically

#### Row Color (Optional)

Choose a status/priority color:

- **None** - No color (default)
- **Important** - Red background (urgent items)
- **Warning** - Yellow background (attention needed)
- **Normal** - Green background (standard entries)
- **Information** - Light blue background (informational)
- **Success** - Light green background (completed/resolved)

### Step 3: Submit

1. Review all fields
2. Click **"Create Log"** button
3. The form closes and your log appears in the table

### Validation Errors

If you see red error messages:

- **Date required** - Select a date and time
- **Short description required** - Enter a description (max 50 chars)
- **Note required** - Enter details (max 1000 chars)
- **Worker name must be 3 letters** - Enter exactly 3 letters (A-Z only)

---

## Viewing Logs

### Main Log Table

The table shows:

- **Date & Time** - When the event occurred
- **Short Description** - Brief summary
- **Note** - Full details (may be truncated with "Read more")
- **Worker** - 3-letter worker code
- **Actions** - Edit, Archive, Delete buttons
- **🔍 Icon** - Magnifying glass to view expanded details

### Note Display

- Notes longer than a certain length show "... Read more"
- Click **"Read more"** to see the full note
- Click **"Read less"** to collapse
- **@mentions** are highlighted in yellow (e.g., @user, @all)

### Row Colors

- Log entries with color coding have colored backgrounds:
  - **Red** = Important
  - **Yellow** = Warning
  - **Green** = Normal
  - **Light Blue** = Information
  - **Light Green** = Success

### Pagination

- If you have many logs, they're split across pages
- Use **← Previous** and **Next →** buttons to navigate
- Current page number is shown (e.g., "Page 2 of 5")

---

## Editing Log Entries

### Method 1: Using Edit Button

1. Find the log entry in the table
2. Click the **"Edit"** button in the Actions column
3. The form opens with current values
4. Make your changes
5. Click **"Update"** button
6. The form closes and the entry updates
7. The updated row will **flash** for 3 seconds to indicate the change

### Method 2: Using Expanded View

1. Click the **🔍 magnifying glass** icon next to Short Description
2. The expanded view opens
3. Click **"Edit"** button at the bottom
4. Form opens, make changes, click **"Update"**
5. Expanded view closes automatically

### What Can Be Edited

- ✅ Date & Time
- ✅ Short Description
- ✅ Note (full text with formatting)
- ✅ Worker Name
- ✅ Color/Status

---

## Archiving and Restoring

### Archive a Log

Archiving hides a log from normal view but keeps it in the system for historical reference.

1. Find the log entry
2. Click **"Archive"** button
3. The log moves to archived status
4. It appears grayed out (if "Show Archived" is enabled)

### Restore an Archived Log

1. Enable **"Show Archived"** checkbox in filters
2. Find the archived log (appears grayed out)
3. Click **"Restore"** button
4. The log returns to normal status

### Archive via Expanded View

1. Click **🔍 magnifying glass** to open expanded view
2. Click **"Archive"** or **"Restore"** button
3. View closes automatically

---

## Deleting Log Entries

### Delete a Log

**⚠️ Warning:** Deleting cannot be undone easily (though data remains in database).

1. Find the log entry
2. Click **"Delete"** button
3. A **confirmation modal** appears in the center of the screen showing:
   - Log date and time
   - Short description
4. Click **"Delete"** in the modal to confirm, or **"Cancel"** to abort
5. The log is removed from view (soft deleted)

### What Happens When Deleted

- The log is marked as deleted in the database
- It no longer appears in the list
- It can potentially be recovered by an administrator

---

## Searching and Filtering

### Quick Search

1. Type in the **Search** box at the top
2. Search looks through:
   - Short descriptions
   - Notes
   - Worker names
3. Press **Enter** or wait for automatic search
4. Results filter in real-time

### Filter by Worker

1. In the **Worker Name** filter field
2. Enter exactly 3 letters (e.g., ABC)
3. Press **Enter** or click **"Apply Filters"**
4. Only logs from that worker are shown

### Filter by Date Range

1. **Start Date:** Click and select the beginning date/time
2. **End Date:** Click and select the ending date/time
3. Press **Enter** or click **"Apply Filters"**
4. Only logs within the date range are shown

### Apply Filters

- Click **"Apply Filters"** button to activate all filters
- Or press **Enter** in any filter field to search immediately

### Reset Filters

1. Click **"Reset"** button
2. All filters are cleared
3. All logs are shown again

### Show Archived

- Check **"Show Archived"** checkbox to see archived logs
- Uncheck to hide them
- Archived logs appear grayed out

---

## Expanded Log View

### Opening Expanded View

1. Click the **🔍 magnifying glass** icon next to any Short Description
2. A large modal window opens
3. Shows all log details with bigger text for easy reading

### Viewing Details

The expanded view shows:

- **Date & Time** - Large, easy to read
- **Short Description** - Prominently displayed
- **Note** - Full text with proper formatting
- **Worker** - Badge display
- **Color/Status** - Background color indicates priority

### Navigation Between Logs

You can navigate through logs without closing the expanded view:

#### Using Keyboard

- **Left Arrow (←)** or **<** key - Go to previous log
- **Right Arrow (→)** or **>** key - Go to next log
- **Escape (Esc)** - Close the expanded view

#### Using Buttons

- **< Button** (left side) - Previous log
- **> Button** (right side) - Next log
- Smooth slide animation when switching

### Counter Display

- Shows **"X of Y"** (e.g., "3 of 15")
- Indicates your position in the log list

### Actions in Expanded View

- **Edit** - Opens edit form, closes expanded view
- **Archive/Restore** - Changes archive status, closes expanded view
- **Close (×)** - Returns to main view

---

## Printing Logs

### Print Visible Logs

1. Apply any filters to show only the logs you want
2. Click **"Print Visible Logs"** button
3. Browser print dialog opens
4. Preview shows:
   - Page Name + Date (format: "Name 2025.11.20")
   - Generation date and time
   - Total entries count
   - Complete table with all visible logs

### Print Settings

In the print dialog:

- Choose your printer
- Select **"Save as PDF"** to create a PDF file
- Adjust margins if needed
- Choose portrait or landscape orientation

### What Gets Printed

- All currently visible logs (after filters applied)
- Date & Time
- Short Description
- Note (formatted)
- Worker name
- Professional table layout

---

## Information Slide

### Accessing Permanent Info

1. Click the **(i) icon** on the left side of the window
2. A slide-out panel opens from the left
3. Shows permanent information set by administrator

### Using the Info Slide

- **Read the information** - Important notices, procedures, etc.
- **Close by clicking:**
  - The **(i) icon** again
  - Outside the slide panel
  - The **× button** in the top right

### What's Displayed

The administrator can set:

- General notices
- Procedures
- Important contact information
- Shift instructions
- Any permanent information needed
- Rich text formatting (bold, colors, emojis, etc.)

---

## Admin Settings

### Accessing Admin Settings

**⚠️ Requires Admin Login**

1. Click **"⚙️ Admin"** link in the header
2. Login screen appears:
   - **Username:** admin
   - **Password:** pass123 (default, must be changed on first login)
3. Click **"Login"**

### First Time Login

If it's your first login:

1. You'll be prompted to **change the password**
2. Enter:
   - **Current password:** pass123
   - **New password:** (at least 6 characters)
   - **Confirm password:** (must match)
3. Click **"Change Password"**
4. You'll then access the settings

### Settings Available

#### Page Name

- Change the application title
- Appears in the header
- Example: "Hotel Little Paris Handover"
- Changes take effect immediately

#### Permanent Information

- Edit the information shown in the info slide using the **WYSIWYG rich text editor** (same editor as notes, with all formatting options)
- **All formatting options available:**
  - Bold, italic, underline, strikethrough
  - Text color and highlight color
  - Emoji selector
  - Multiple paragraphs with proper spacing
- Supports multiple lines and paragraphs - what you see is what you get!
- Use **@mentions** like `@user` or `@all` (email addresses are automatically excluded)
- Click **(i)** button to preview the formatted information
- Changes save immediately

#### Login Settings

**Enable Login Expiry**

- Toggle to enable or disable login session expiry
- When enabled, users must re-login after the set time period
- When disabled, sessions never expire (users stay logged in until manual logout)

**Login Expiry (Hours)**

- Only visible when "Enable Login Expiry" is checked
- How long a login session lasts for all users
- Range: 1-168 hours (1 hour to 1 week)
- Default: 24 hours
- Users must re-login after expiry (if enabled)

#### User Management

**Managing Users**

- Add, edit, delete, and reorder users
- All users can have an email address registered
- Users can be assigned as **Admin** or **Normal User**
- Admins have access to settings page
- Normal users can only access the main application

**Default Users**

- **admin** - Admin user (password: pass123) - Cannot be deleted or renamed
- **FO** - Normal user (password: pass123)

**Adding Users**

1. Click **"+ Add User"** button
2. Enter username (required)
3. Enter email (optional)
4. Enter password (required, minimum 6 characters)
5. Check **"Admin"** if user should have admin access
6. Check **"Send password to email"** if email is provided and you want to send credentials
7. Click **"Create User"**

**Editing Users**

1. Click **"Edit"** next to any user
2. Modify username (except for admin user), email, password, or admin status
3. Check **"Send password to email"** to send updated password via email
4. Click **"Update User"**

**Reordering Users**

- Use **↑** and **↓** buttons to move users up or down in the list
- Order affects how users appear in the system

**Deleting Users**

- Click **"Delete"** next to any user (except admin)
- Confirm deletion
- **Note:** Admin user cannot be deleted or renamed

**Sending Password via Email**

- When creating or editing a user, check **"Send password to email"**
- Requires email address to be set for the user
- Requires SMTP configuration in environment variables
- Email will contain username and password

### Saving Settings

1. Make your changes
2. Click **"Save Configuration"** button
3. Success message appears
4. Changes take effect immediately
5. Page refreshes to show updates

### Logging Out

- Click **"Logout"** button in the settings page
- Or close the browser tab
- Session expires after the set time (if login expiry is enabled)

---

## User Login

### When Login is Required

- Login is always required to access the application
- You'll see a login screen when accessing the application
- Must login before seeing any logs

### Logging In

1. Enter your **Username** (created by admin)
2. Enter your **Password** (set by admin)
3. Click **"Login"** button
4. You'll see the main application

**Default Credentials:**

- **admin** / **pass123** (admin access)
- **FO** / **pass123** (normal user)

### Login Expiry

- If enabled, login expires after the set number of hours
- Default is 24 hours (if enabled)
- When expired, you must login again
- If disabled, sessions never expire (until manual logout)
- No automatic logout notification

### Too Many Failed Attempts

- After 10 failed login attempts, you're blocked
- Must wait 2 minutes before trying again
- Countdown timer shows remaining seconds

---

## Tips and Shortcuts

### Keyboard Shortcuts

#### In Expanded View

- **← Left Arrow** - Previous log
- **→ Right Arrow** - Next log
- **Esc** - Close expanded view

#### In Search/Filter Fields

- **Enter** - Apply search/filter immediately
- Works in:
  - Search box
  - Worker Name field
  - Date fields

### Best Practices

#### Creating Logs

- ✅ Be specific in short description
- ✅ Include all relevant details in notes
- ✅ Use @mentions for important notifications
- ✅ Choose appropriate color/status
- ✅ Verify worker name is correct

#### Organizing Logs

- ✅ Use archive for completed/resolved items
- ✅ Keep active logs unarchived
- ✅ Use filters to find specific entries
- ✅ Use color coding consistently

#### Searching

- ✅ Use specific keywords
- ✅ Combine filters for better results
- ✅ Clear filters when starting new search

### @Mentions Feature

- Type **@** followed by a word (e.g., `@user`, `@all`, `@manager`)
- These will be **highlighted in yellow** in the notes
- Useful for calling attention to specific people
- No actual notification sent (visual only)
- Email addresses are automatically excluded from mentions

---

## Troubleshooting

### Can't See Any Logs

**Check:**

1. Are filters applied? Click **"Reset"**
2. Is "Show Archived" checked? Try unchecking it
3. Are you on the right page? Check pagination
4. Try refreshing the page (F5)

### Can't Create/Edit/Delete

**Check:**

1. Are you logged in? (if login is enabled)
2. Check browser console for errors (F12)
3. Is backend server running?
4. Try refreshing the page

### Search Not Working

**Solutions:**

1. Clear search field and try again
2. Check for typos
3. Try broader search terms
4. Press Enter after typing

### Print Not Working

**Solutions:**

1. Check if pop-ups are blocked
2. Allow pop-ups for localhost
3. Try a different browser
4. Use "Save as PDF" option

### Can't Login

**Solutions:**

1. Check username and password (case-sensitive)
2. Wait if blocked (too many attempts)
3. Ask administrator to reset password
4. Verify login expiry settings if session expired

### Expanded View Not Opening

**Solutions:**

1. Make sure you clicked the magnifying glass icon (🔍)
2. Try clicking a different log entry
3. Refresh the page (F5)
4. Check browser console for errors

### Color/Status Not Showing

**Solutions:**

1. Make sure you selected a color when creating/editing
2. Refresh the page to see updates
3. Check if browser supports CSS properly

### Time Not Updating

**Solutions:**

1. Refresh the page
2. Check browser JavaScript is enabled
3. Time updates every second automatically

### Data Not Saving

**Solutions:**

1. Check internet/network connection
2. Verify backend is running
3. Check browser console for errors (F12)
4. Try refreshing and creating again

---

## Quick Reference

### Status Colors

- 🔴 **Important** (Red) - Urgent, needs immediate attention
- 🟡 **Warning** (Yellow) - Attention needed
- 🟢 **Normal** (Green) - Standard entry
- 🔵 **Information** (Light Blue) - Informational only
- 🟢 **Success** (Light Green) - Completed/resolved

### Button Functions

- **Create New Log** - Add new entry
- **Edit** - Modify existing entry
- **Archive** - Hide from normal view
- **Restore** - Un-archive
- **Delete** - Remove entry (with confirmation)
- **Print Visible Logs** - Print current view
- **Apply Filters** - Activate search/filters
- **Reset** - Clear all filters

### Navigation

- **Previous/Next** - Move between pages
- **🔍 Magnifying Glass** - Expanded view
- **← → Arrows** - Navigate in expanded view
- **(i) Button** - Permanent information

### Admin Functions

- **⚙️ Admin** - Settings (requires login)
- Change page name
- Edit permanent info
- Configure user login
- Set login expiry time
- Manage users

---

## Need Help?

If you encounter issues not covered here:

1. Check the **docs/TROUBLESHOOTING.md** file
2. Contact your system administrator
3. Check browser console for error messages (F12)
4. Verify all services are running correctly

---

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025

Happy logging! 📝
