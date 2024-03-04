const express = require('express');
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkShortener';

app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const linkSchema = new mongoose.Schema({
    longUrl: String,
    shortCode: String,
});

const Link = mongoose.model('Link', linkSchema);

app.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;

    try {
        const existingLink = await Link.findOne({ longUrl });
        if (existingLink) {
            res.json({ shortUrl: existingLink.shortCode });
        } else {
            const shortCode = nanoid(7); // You can adjust the length of the short code
            const newLink = new Link({ longUrl, shortCode });
            await newLink.save();
            res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}` });
        }
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const link = await Link.findOne({ shortCode });

        if (link) {
            res.redirect(link.longUrl);
        } else {
            res.status(404).send('Not Found');
        }
    } catch (error) {
        console.error('Error redirecting:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
