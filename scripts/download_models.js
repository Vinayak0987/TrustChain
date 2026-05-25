import fs from 'fs';
import https from 'https';
import path from 'path';

const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

const DIR = path.join(process.cwd(), 'public', 'models');

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    // Add cache buster to prevent stale partial downloads
    const finalUrl = url + '?t=' + Date.now();
    
    https.get(finalUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error('Failed to download ' + url + ': ' + response.statusCode));
      }
      
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        // Simple verification - should be > 100 bytes
        if (fs.statSync(dest).size < 100) {
          fs.unlinkSync(dest);
          return reject(new Error('File too small: ' + dest));
        }
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
};

const main = async () => {
  console.log('🔄 Cleaning model directory and redownloading shards...');
  if (fs.existsSync(DIR)) {
    // We'll only delete the shards to force a clean pull
    const files = fs.readdirSync(DIR);
    for (const f of files) {
      if (f.includes('shard')) fs.unlinkSync(path.join(DIR, f));
    }
  } else {
    fs.mkdirSync(DIR, { recursive: true });
  }

  for (const model of MODELS) {
    console.log(`📡 Downloading ${model}...`);
    try {
      await download(MODELS_URL + model, path.join(DIR, model));
    } catch(e) {
      console.error(`❌ Failed: ${model} - ${e.message}`);
    }
  }
  console.log('✅ Models refreshed!');
};

main();
