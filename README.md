# Feedback sheet setup

The feedback form sends one row per submission with these columns:

1. Submitted at
2. Type
3. Feedback
4. Name (optional)

It does not request or store an IP address or email address. If an older sheet already has an IP column from a prior experiment, this code leaves that existing column and any old values untouched; it simply stops adding IPs to new submissions.

## Connect or update the Google Apps Script

1. Open your spreadsheet and choose **Extensions → Apps Script**.
2. Replace `Code.gs` with the code in this folder and save.
3. Choose **Deploy → Manage deployments**, edit the existing web app deployment, select a new version, and deploy. If you do not have a deployment yet, choose **New deployment → Web app** and allow access to people who should submit feedback.
4. Keep the deployment URL in `feedback-config.js` set to the `/exec` URL. The current URL is already there.
5. Submit a test entry and check the `Feedback` tab.

The connector validates categories and message length, blocks basic automated submissions with a honeypot, limits volume, and writes user text as plain text rather than formulas. Anyone with the web app endpoint can submit, so don't invite people to include sensitive information.
