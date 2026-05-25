import fs from 'fs';
import path from 'path';

const DIR = './public/models';

const fixModel = (manifestName) => {
  const manifestPath = path.join(DIR, manifestName);
  if (!fs.existsSync(manifestPath)) return;
  
  const manifestStr = fs.readFileSync(manifestPath, 'utf8');
  let manifest = JSON.parse(manifestStr);
  
  manifest.forEach(group => {
    group.paths = group.paths.map(p => {
      const oldPath = path.join(DIR, p);
      const newName = p.endsWith('.bin') ? p : p + '.bin';
      const newPath = path.join(DIR, newName);
      
      if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${p} -> ${newName}`);
      }
      return newName;
    });
  });
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log(`Updated manifest: ${manifestName}`);
};

const main = () => {
  const files = fs.readdirSync(DIR);
  const manifests = files.filter(f => f.endsWith('.json'));
  manifests.forEach(m => fixModel(m));
};

main();
