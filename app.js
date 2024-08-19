const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');
const crypto = require('crypto'); // Import crypto for generating random strings

const app = express();
const port = 3000;

let recentWebsites = [];

app.use(express.static('public'));
app.use(express.json());

app.post('/save-page', async (req, res) => {
    const { url } = req.body;

    try {
        const parsedUrl = urlParser.parse(url);
        const domain = parsedUrl.hostname;
        const response = await axios.get(url);
        const pageContent = response.data;

        const websiteDir = path.join(__dirname, 'saved_pages', domain);
        if (!fs.existsSync(websiteDir)) {
            fs.mkdirSync(websiteDir, { recursive: true });
        }

        // Generate a random string for the file name
        const randomString = crypto.randomBytes(8).toString('hex');
        const filePath = path.join(websiteDir, `${randomString}.html`);
        const routeName = randomString;

        fs.writeFileSync(filePath, pageContent);

        // Create a dynamic route for the saved page
        app.get(`/${routeName}`, (req, res) => {
            res.sendFile(filePath);
        });

        recentWebsites.unshift({ domain, route: `/${routeName}`, timestamp: new Date().toISOString() });
        if (recentWebsites.length > 5) {
            recentWebsites.pop();
        }

        res.json({ message: 'Page saved successfully!', route: `/${routeName}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save the page.' });
    }
});

app.get('/recent-websites', (req, res) => {
    res.json(recentWebsites);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
