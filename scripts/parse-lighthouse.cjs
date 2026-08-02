const fs = require('fs');
const path = require('path');

const reportFile = path.resolve(__dirname, '..', 'lighthouse-home.json');
const outputReport = path.resolve(__dirname, '..', 'scripts-output-lh.json');

if (!fs.existsSync(reportFile)) {
    console.error('Lighthouse report file not found!');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

const scores = {
    performance: Math.round(data.categories.performance.score * 100),
    accessibility: Math.round(data.categories.accessibility.score * 100),
    bestPractices: Math.round(data.categories['best-practices'].score * 100),
    seo: Math.round(data.categories.seo.score * 100)
};

const audits = data.audits;
const metrics = {
    fcp: audits['first-contentful-paint'].displayValue,
    lcp: audits['largest-contentful-paint'].displayValue,
    tbt: audits['total-blocking-time'].displayValue,
    cls: audits['cumulative-layout-shift'].displayValue,
    speedIndex: audits['speed-index'].displayValue,
    ttfb: audits['server-response-time'].displayValue, // server-response-time is TTFB
    inp: audits['interactive'] ? audits['interactive'].displayValue : 'N/A' // Lighthouse interactive acts as a proxy or we look for INP
};

const results = {
    scores,
    metrics,
    diagnostic: {
        renderBlocking: audits['render-blocking-resources'] ? audits['render-blocking-resources'].details : null,
        unusedJs: audits['unused-javascript'] ? audits['unused-javascript'].details : null,
        unusedCss: audits['unused-css-rules'] ? audits['unused-css-rules'].details : null,
        hugePayloads: audits['total-byte-weight'] ? audits['total-byte-weight'].displayValue : null,
        efficientCache: audits['uses-long-cache-ttl'] ? audits['uses-long-cache-ttl'].displayValue : null
    }
};

fs.writeFileSync(outputReport, JSON.stringify(results, null, 2), 'utf8');
console.log('Lighthouse summary extracted to:', outputReport);
console.log('Scores:', scores);
console.log('Metrics:', metrics);
