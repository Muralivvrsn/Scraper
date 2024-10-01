const express = require('express');
const puppeteer = require('puppeteer');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Scraper function that scrapes the blog and returns the post data
async function scrapeBlog() {
    const browser = await puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-zygote',
        '--single-process'
    ]
});

    const page = await browser.newPage();

    // Navigate to the blog page
    await page.goto('https://www.signzy.com/blog/', { waitUntil: 'networkidle2' });

    // Wait for articles to be loaded
    await page.waitForSelector('article');

    // Extract post URLs and metadata
    const articles = await page.evaluate(() => {
        const articleElements = document.querySelectorAll('article');
        const articleData = Array.from(articleElements).map(article => {
            const postUrl = article.querySelector('a') ? article.querySelector('a').href : null;
            const postTitle = article.querySelector('a').innerText || null;
            const postTime = article.querySelector('time') ? article.querySelector('time').getAttribute('datetime') : null;
            // console.log({post/Title, postUrl, postTime})
            return {
                postTitle,
                postUrl,
                postTime,
            };
        });
        return articleData;
    });

    let scrapedData = [];
    console.log(articles)

    // Scrape the details from each post URL
    for (let article of articles) {
        try {
            if (article.postUrl) {
                const postPage = await browser.newPage();
                await postPage.goto(article.postUrl, { waitUntil: 'networkidle2' });

                // Wait for the content to be present
                await postPage.waitForSelector('.entry-content');

                // Extract the content of the post
                const content = await postPage.evaluate(() => {
                    return document.querySelector('.entry-content').innerText;
                });

                // Add the post data to the scrapedData array
                scrapedData.push({
                    title: article.postTitle,
                    url: article.postUrl,
                    time: article.postTime,
                    details: content
                });

                await postPage.close();

                // Wait for 2-3 seconds before moving to the next post
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error(`Error scraping ${article.postUrl}:`, error);
        }
    }

    await browser.close();
    return scrapedData;
}

// API endpoint to scrape and return blog data
app.get('/scrape', async (req, res) => {
    try {
        const data = await scrapeBlog();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error scraping data', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
