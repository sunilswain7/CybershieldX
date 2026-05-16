# CyberShield X — Video Presentation Script (5 Minutes)

## What the Teacher Wants

> "Clearly explain the **countermeasures** implemented to mitigate the attacks listed in the course plan and **demonstrate** how they are addressed in your project."
> Evaluation based on: **understanding of security mechanisms**, their **implementation**, and **explanation of how attacks are mitigated**.

This script focuses on: **what the attack is → how you perform it → what the countermeasure is → show it working**.

---

## Before Recording

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm start`
3. Open http://localhost:3000 in browser
4. Log in (register first if needed — use password `Test@1234`)
5. Go to Dashboard → click **Reset Data** (so dashboard starts clean)
6. Open screen recorder (OBS / built-in)
7. Make sure browser is full screen

---

## THE SCRIPT

---

### [0:00 – 0:30] Introduction

**CLICK:** Open http://localhost:3000 (Home page should be visible)

**SAY:**
"Hi, I am [Your Name], Roll Number [Your Roll Number]. This is my project CyberShield X — an Interactive Cyber Defense Command Center. It is a web application built with React, Node.js, Express, and PostgreSQL. The purpose of this project is to demonstrate how real-world cyber attacks work and what countermeasures we implement to mitigate them. I will now demonstrate four attacks — SQL Injection, Cross-Site Scripting, Brute Force, and File Upload Attack — and show how each one is detected and prevented in our system."

**CLICK:** Click **Attack Simulator** in the navigation bar

---

### [0:30 – 1:45] Attack 1 — SQL Injection

**CLICK:** You should already be on the **SQL Injection** tab (it's the default)

**SAY:**
"The first attack is SQL Injection. In SQL Injection, the attacker injects malicious SQL code through input fields to manipulate the database query."

**CLICK:** Click the payload chip that says `' OR '1'='1' --`

**SAY (while the payload fills into the username field):**
"Here I am entering the payload — single quote, OR, one equals one. This is a classic SQL injection that makes the WHERE clause always evaluate to true."

**POINT** at the **Live Query Preview** box at the bottom:

**SAY:**
"You can see the live query preview here — the malicious input is now part of the SQL statement. If this were a vulnerable application, this query would return all users from the database and bypass authentication completely."

**CLICK:** Click the red **Login (Send Attack)** button

**SAY (while looking at the results):**
"Now look at what happened. The detection engine identified the SQL injection pattern using regular expression matching. And the countermeasure we implemented is **Parameterized Queries**, also called Prepared Statements. Instead of concatenating user input directly into the SQL string, we pass it as a separate parameter. This way the database treats the input strictly as data, never as executable SQL code. The attack is blocked and logged."

**POINT** at the Security Monitor panel on the right:

**SAY:**
"You can also see the security monitor on the right — it shows the full chain: attacker submitted input, SQL injection pattern was detected, parameterized query was used, and the request was blocked."

---

### [1:45 – 2:50] Attack 2 — Cross-Site Scripting (XSS)

**CLICK:** Click the **XSS Attack** tab at the top

**SAY:**
"The second attack is Cross-Site Scripting, or XSS. In XSS, the attacker injects malicious JavaScript into a web page. There are two types I will demonstrate — Stored XSS and Reflected XSS."

**The Comment Box (Stored XSS) mode should be selected by default**

**CLICK:** Click the payload chip that says `<script>alert("XSS")</script>`

**SAY:**
"I am injecting a script tag into the comment box. This is Stored XSS — on a vulnerable website, this script would get saved in the database and execute every time any user views this comment."

**CLICK:** Click the red **Post Comment (Send Attack)** button

**SAY (point at the side-by-side boxes that appear below — red "What attacker sent" vs green "What gets stored"):**
"Look at this comparison. On the left is what the attacker sent — a script tag. On the right is what actually gets stored in the database. The less-than and greater-than symbols are converted to their HTML entity equivalents — `&lt;` and `&gt;`. This is called **Input Sanitization and Output Encoding**. The browser now treats this as plain text, not executable code. The script cannot run."

**CLICK:** Now click the **Search Bar (Reflected XSS)** button to switch modes

**CLICK:** Click the payload chip `<img src=x onerror="steal()">`

**CLICK:** Click the red **Search (Send Attack)** button

**SAY:**
"This was Reflected XSS — the input comes through a search query and gets reflected back. The countermeasure is the same — sanitization. The `onerror` event handler is stripped and HTML tags are escaped. So both Stored and Reflected XSS are mitigated using input sanitization before storage and output encoding before display."

---

### [2:50 – 3:55] Attack 3 — Brute Force

**CLICK:** Click the **Brute Force** tab at the top

**SAY:**
"The third attack is Brute Force. In a brute force attack, the attacker uses automated tools to try many passwords against a user account until the correct one is found."

**CLICK:** The target username field should say "admin". Leave it as is.

**CLICK:** Click the red **Launch Brute Force Attack** button

**SAY (while the attack is running — watch the password attempts appear one by one):**
"You can see the automated attack running — it is trying common passwords one by one. Password... rejected. 123456... rejected. Admin... rejected. Each attempt is being tracked."

**WAIT** for the attack to stop automatically (it will stop after about 5 attempts)

**SAY:**
"The attack has been stopped. We implement three countermeasures for brute force. First — **Account Lockout**. After 5 failed attempts, the account is locked for 15 minutes. Second — **Rate Limiting**. We limit login requests to 10 per IP address per 15 minutes using express-rate-limit. Third — **CAPTCHA** can be triggered at elevated threat levels. These three mechanisms together make automated password guessing impractical."

**POINT** at the Security Monitor:

**SAY:**
"The security monitor shows every attempt was logged, and the defense was triggered — account locked and IP rate-limited."

---

### [3:55 – 4:40] Attack 4 — File Upload Attack

**CLICK:** Click the **File Upload** tab at the top

**SAY:**
"The fourth attack is File Upload Attack. In this attack, the attacker uploads malicious files like PHP scripts or executables to the server. If the server runs them, the attacker can gain remote control."

**CLICK:** Click the red **backdoor.php** file button

**SAY:**
"I am uploading a PHP backdoor script."

**WAIT** for result — it should show **REJECTED**

**CLICK:** Click the red **keylogger.exe** file button

**SAY:**
"Now a keylogger executable."

**WAIT** — **REJECTED** again

**CLICK:** Now click the green **report.pdf** file button

**SAY:**
"And now a normal PDF document."

**WAIT** — **ACCEPTED**

**SAY:**
"You can see — PHP and EXE files were rejected, but the PDF was accepted. The countermeasure is **File Extension Whitelisting**. We maintain a whitelist of safe file types — JPG, PNG, PDF, TXT, DOC — and reject everything else. We also validate the MIME type, rename files with random names on upload, and store them outside the web root so they can never be executed by the server."

---

### [4:40 – 5:00] Dashboard + Conclusion

**CLICK:** Click **Dashboard** in the navigation bar

**SAY:**
"Finally, this is our Security Dashboard. It shows all the attacks we just performed in real-time. You can see the total number of attacks blocked, the threat level, attack distribution by type in this bar chart, and security alerts with severity levels. Every attack is logged with its type, payload, and timestamp."

**SAY:**
"To summarize — CyberShield X implements countermeasures for SQL Injection using parameterized queries, for XSS using input sanitization and output encoding, for Brute Force using account lockout and rate limiting, and for File Upload attacks using extension whitelisting. The system also has a 5-level automated response engine that escalates from logging to IP blocking based on threat severity. Thank you."

---

## Quick Checklist Before Submitting

- [ ] Video is under 5 minutes
- [ ] You said your name and roll number
- [ ] You explained each attack (what it is)
- [ ] You demonstrated each attack (typed/clicked the payload)
- [ ] You explained each countermeasure (how it prevents the attack)
- [ ] You showed the countermeasure working (blocked result / sanitized output / lockout)
- [ ] You showed the dashboard at the end
- [ ] Audio is clear
- [ ] File name: `CyberShieldX_[YourName].mp4`

---

## Viva Quick Reference

If the teacher asks follow-up questions:

| Question | Answer |
|----------|--------|
| What is SQL Injection? | Attacker injects SQL code through input fields to manipulate database queries |
| How do you prevent it? | Parameterized queries — input is treated as data, not code |
| What is XSS? | Attacker injects JavaScript into web pages to steal data or hijack sessions |
| Stored vs Reflected XSS? | Stored saves the script in database, Reflected sends it via URL and reflects it back |
| How do you prevent XSS? | Input sanitization — escape HTML characters before storage and display |
| What is Brute Force? | Trying many password combinations automatically until correct one is found |
| How do you prevent it? | Account lockout after 5 failures, IP rate limiting, CAPTCHA |
| What is File Upload attack? | Uploading malicious scripts that the server might execute |
| How do you prevent it? | Whitelist allowed extensions, validate MIME type, rename files, store outside web root |
| What is CSRF? | Tricks logged-in user into making unwanted requests via hidden forms |
| How do you prevent CSRF? | CSRF tokens and SameSite cookies |
| What is Session Hijacking? | Stealing session cookies to impersonate users |
| How do you prevent it? | HttpOnly, Secure, SameSite cookies, short session expiry |
| What tech stack? | React, Tailwind CSS, Node.js, Express, PostgreSQL, bcrypt, JWT, Helmet |
| What is your response system? | 5 levels: Log → Warn → CAPTCHA → Block IP → Notify Admin |
